// src/App.jsx
import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { auth, db } from "./firebase";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
} from "firebase/firestore";
// === YENİ: React Portal (Modal için) ===
import { createPortal } from "react-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./App.css";

// === GÜNCELLENDİ: Yeni kullanıcı şablonu 'description' içeriyor ===
const initialDataTemplate = {
  tasks: {
    "task-1": {
      id: "task-1",
      content: "Hoş geldin! Bir kartı sürükle.",
      description: "Bu bir açıklama metnidir.",
    },
    "task-2": {
      id: "task-2",
      content: 'Bu kartı "Yapılıyor"a sürükle.',
      description: "",
    },
    "task-3": {
      id: "task-3",
      content: "Bu sütunun altından yeni kart ekle.",
      description: "",
    },
  },
  columns: {
    "column-1": {
      id: "column-1",
      title: "📝 Yapılacaklar",
      taskIds: ["task-1", "task-2", "task-3"],
    },
    "column-2": {
      id: "column-2",
      title: "💻 Yapılıyor",
      taskIds: [],
    },
    "column-3": {
      id: "column-3",
      title: "✅ Bitti",
      taskIds: [],
    },
  },
  columnOrder: ["column-1", "column-2", "column-3"],
};

// --- Component'ler (Formlar) ---

// Kart Ekleme Formu (Değişiklik yok)
function AddTaskForm({ columnId, onAddTask, onCancel }) {
  const [content, setContent] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onAddTask(columnId, content);
      setContent("");
      onCancel();
    }
  };
  return (
    <form className="add-task-form" onSubmit={handleSubmit}>
      <textarea
        className="add-task-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Bu kart için bir başlık girin..."
        autoFocus
      />
      <div className="add-form-controls">
        <button type="submit" className="add-task-submit-btn">
          Kart Ekle
        </button>
        <button
          type="button"
          className="add-task-cancel-btn"
          onClick={onCancel}
        >
          ×
        </button>
      </div>
    </form>
  );
}

// Sütun Ekleme Formu (Değişiklik yok)
function AddColumnForm({ onAddColumn, onCancel }) {
  const [title, setTitle] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onAddColumn(title);
      setTitle("");
    }
  };
  return (
    <div className="add-column-form">
      <form onSubmit={handleSubmit}>
        <input
          className="add-column-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Liste başlığı girin..."
          autoFocus
        />
        <div className="add-column-controls">
          <button type="submit" className="add-column-submit-btn">
            Liste Ekle
          </button>
          <button
            type="button"
            className="add-column-cancel-btn"
            onClick={onCancel}
          >
            ×
          </button>
        </div>
      </form>
    </div>
  );
}

// === YENİ: Kart Düzenleme Modalı Component'i ===
// Bu, App component'inin *dışında* veya *içinde* tanımlanabilir.
// Temizlik için dışarıda tanımlayalım.
function TaskEditModal({ task, column, onClose, onSave }) {
  // Modal'ın kendi iç state'i (formu yönetmek için)
  const [content, setContent] = useState(task.content);
  const [description, setDescription] = useState(task.description || "");

  // Form gönderildiğinde (Kaydet'e basıldığında)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onSave(task.id, content, description);
    }
  };

  // HTML'deki modal yapısını React Portal kullanarak 'root'un dışına render et
  return createPortal(
    <div id="task-modal-overlay" className="modal-goster">
      <div id="task-modal-content" className="task-modal">
        <button
          id="task-modal-close-btn"
          className="modal-close-btn"
          onClick={onClose}
        >
          ×
        </button>

        <form id="task-edit-form" onSubmit={handleSubmit}>
          {/* Sütun adını da gösterelim */}
          <p style={{ color: "#5E6C84", margin: 0 }}>
            Liste: <strong>{column.title}</strong>
          </p>

          <label htmlFor="task-modal-title">Kart Başlığı</label>
          <input
            type="text"
            id="task-modal-title"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />

          <label htmlFor="task-modal-description">Açıklama</label>
          <textarea
            id="task-modal-description"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kartınız için bir açıklama ekleyin..."
          ></textarea>

          <button type="submit" className="modal-save-btn">
            Kaydet
          </button>
        </form>
      </div>
    </div>,
    document.body // Modalı <body>'nin sonuna ekle
  );
}

// === Ana APP Component'i ===
function App() {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [boardId, setBoardId] = useState(null);
  const [authError, setAuthError] = useState("");
  const [addingTaskToColumn, setAddingTaskToColumn] = useState(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  // === YENİ: Modal State'leri ===
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  // Hangi task'in düzenlendiğini tutar (task objesi VE parent column'un ID'si)
  const [editingTaskInfo, setEditingTaskInfo] = useState(null);

  // Auth ve Pano dinleyicileri (Değişiklik yok)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setupBoardListener(currentUser.uid);
      } else {
        setUser(null);
        setData(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const setupBoardListener = (uid) => {
    setLoading(true);
    const q = query(collection(db, "boards"), where("userId", "==", uid));
    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        if (querySnapshot.empty) {
          await createNewBoard(uid);
        } else {
          const boardDoc = querySnapshot.docs[0];
          setData(boardDoc.data().boardData);
          setBoardId(boardDoc.id);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Pano dinlenirken hata:", error);
        setLoading(false);
      }
    );
    return unsubscribe;
  };

  const createNewBoard = async (uid) => {
    try {
      const newBoard = { userId: uid, boardData: initialDataTemplate };
      const docRef = await addDoc(collection(db, "boards"), newBoard);
      setBoardId(docRef.id);
      setLoading(false);
    } catch (error) {
      console.error("Yeni pano oluşturulurken hata:", error);
      setAuthError("Pano oluşturulamadı.");
    }
  };

  // === GÜNCELLENDİ: Artık sadece boardData'yı güncelliyor ===
  const updateFirestoreBoard = async (boardData) => {
    if (!boardId) return;
    try {
      const boardRef = doc(db, "boards", boardId);
      await updateDoc(boardRef, { boardData }); // Sadece boardData'yı yaz
    } catch (error) {
      console.error("Pano güncellenirken hata:", error);
    }
  };

  // Sürükleme Bitişi (Değişiklik yok)
  const onDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    if (type === "column") {
      const newColumnOrder = Array.from(data.columnOrder);
      newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, draggableId);
      const newData = { ...data, columnOrder: newColumnOrder };
      setData(newData);
      updateFirestoreBoard(newData);
      return;
    }

    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];
    let newData;
    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
      const newColumn = { ...startColumn, taskIds: newTaskIds };
      newData = {
        ...data,
        columns: { ...data.columns, [newColumn.id]: newColumn },
      };
    } else {
      const startTaskIds = Array.from(startColumn.taskIds);
      startTaskIds.splice(source.index, 1);
      const newStartColumn = { ...startColumn, taskIds: startTaskIds };
      const finishTaskIds = Array.from(finishColumn.taskIds);
      finishTaskIds.splice(destination.index, 0, draggableId);
      const newFinishColumn = { ...finishColumn, taskIds: finishTaskIds };
      newData = {
        ...data,
        columns: {
          ...data.columns,
          [newStartColumn.id]: newStartColumn,
          [newFinishColumn.id]: newFinishColumn,
        },
      };
    }
    setData(newData);
    updateFirestoreBoard(newData);
  };

  // === GÜNCELLENDİ: Yeni task 'description' alanı içeriyor ===
  const handleAddTask = (columnId, content) => {
    const newTaskId = uuidv4();
    const newTask = {
      id: newTaskId,
      content: content,
      description: "", // Yeni task'e boş açıklama ekle
    };
    const column = data.columns[columnId];
    const newTaskIds = [...column.taskIds, newTaskId];
    const newData = {
      ...data,
      tasks: { ...data.tasks, [newTaskId]: newTask },
      columns: {
        ...data.columns,
        [columnId]: { ...column, taskIds: newTaskIds },
      },
    };
    setData(newData);
    updateFirestoreBoard(newData);
  };

  // Kart Silme (Değişiklik yok)
  const handleDeleteTask = (taskId, columnId) => {
    if (!window.confirm("Bu kartı silmek istediğinize emin misiniz?")) return;
    const column = data.columns[columnId];
    const newTaskIds = column.taskIds.filter((id) => id !== taskId);
    const newTasks = { ...data.tasks };
    delete newTasks[taskId];
    const newData = {
      ...data,
      tasks: newTasks,
      columns: {
        ...data.columns,
        [columnId]: { ...column, taskIds: newTaskIds },
      },
    };
    setData(newData);
    updateFirestoreBoard(newData);
  };

  // Sütun Ekleme (Değişiklik yok)
  const handleAddColumn = (title) => {
    const newColumnId = uuidv4();
    const newColumn = { id: newColumnId, title: title, taskIds: [] };
    const newData = {
      ...data,
      columns: { ...data.columns, [newColumnId]: newColumn },
      columnOrder: [...data.columnOrder, newColumnId],
    };
    setData(newData);
    updateFirestoreBoard(newData);
    setIsAddingColumn(false);
  };

  // Sütun Silme (Değişiklik yok)
  const handleDeleteColumn = (columnId) => {
    const column = data.columns[columnId];
    if (column.taskIds.length > 0) {
      if (
        !window.confirm(
          "Bu sütunda kartlar var. Sütunu (ve içindeki tüm kartları) silmek istediğinize emin misiniz?"
        )
      )
        return;
    } else {
      if (!window.confirm("Bu sütunu silmek istediğinize emin misiniz?"))
        return;
    }
    const newTasks = { ...data.tasks };
    column.taskIds.forEach((taskId) => {
      delete newTasks[taskId];
    });
    const newColumns = { ...data.columns };
    delete newColumns[columnId];
    const newColumnOrder = data.columnOrder.filter((id) => id !== columnId);
    const newData = {
      tasks: newTasks,
      columns: newColumns,
      columnOrder: newColumnOrder,
    };
    setData(newData);
    updateFirestoreBoard(newData);
  };

  // === YENİ: Modal Fonksiyonları ===
  const handleOpenTaskModal = (task, columnId) => {
    setEditingTaskInfo({
      task: task,
      column: data.columns[columnId],
    });
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTaskInfo(null);
  };

  // === YENİ: Modal'dan Gelen Güncellemeyi Kaydetme ===
  // Bu, tüm panoyu değil, SADECE o tek kartı günceller
  const handleTaskModalSave = async (taskId, newContent, newDescription) => {
    // 1. Arayüzü anında güncelle (Optimistic Update)
    const updatedTask = {
      ...data.tasks[taskId],
      content: newContent,
      description: newDescription,
    };
    const newData = {
      ...data,
      tasks: {
        ...data.tasks,
        [taskId]: updatedTask,
      },
    };
    setData(newData);

    // 2. Modalı kapat
    handleCloseTaskModal();

    // 3. Firebase'i verimli bir şekilde güncelle
    // Sadece 'tasks' objesinin *içindeki* o tek alanı güncelle
    // Dot notation (nokta gösterimi) kullanıyoruz
    try {
      const boardRef = doc(db, "boards", boardId);
      // Bu, "boardData.tasks.task-1.content" gibi bir string oluşturur
      const taskContentField = `boardData.tasks.${taskId}.content`;
      const taskDescriptionField = `boardData.tasks.${taskId}.description`;

      await updateDoc(boardRef, {
        [taskContentField]: newContent,
        [taskDescriptionField]: newDescription,
      });
      console.log("Kart başarıyla güncellendi!");
    } catch (error) {
      console.error("Kart güncellenirken hata:", error);
      // Hata olursa, optimistic update'i geri al (şimdilik basit tutuyoruz)
      // onSnapshot'un tekrar çekmesini bekleyebiliriz.
    }
  };

  // --- Auth Fonksiyonları (Değişiklik yok) ---
  const handleRegister = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthError(error.message);
    }
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthError(error.message);
    }
  };
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  // === RENDER BÖLÜMÜ ===

  if (loading) {
    return <div className="loading-screen">Yükleniyor...</div>;
  }

  if (!user) {
    return (
      <div className="auth-wrapper">
        <div className="auth-container">
          <form onSubmit={handleLogin} className="auth-form">
            <h2>Giriş Yap</h2>
            <input name="email" type="email" placeholder="Email" required />
            <input
              name="password"
              type="password"
              placeholder="Şifre"
              required
            />
            <button type="submit">Giriş Yap</button>
            {authError && <p className="auth-error">{authError}</p>}
          </form>
          <hr />
          <form onSubmit={handleRegister} className="auth-form">
            <h2>Kayıt Ol</h2>
            <input name="email" type="email" placeholder="Email" required />
            <input
              name="password"
              type="password"
              placeholder="Şifre (min. 6 karakter)"
              required
            />
            <button type="submit">Kayıt Ol</button>
          </form>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="loading-screen">Pano verisi bekleniyor...</div>;
  }

  return (
    <>
      <button onClick={handleLogout} className="logout-button">
        Çıkış Yap ({user.email})
      </button>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable
          droppableId="all-columns"
          direction="horizontal"
          type="column"
        >
          {(provided) => (
            <div
              className="board-container"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {data.columnOrder.map((columnId, index) => {
                const column = data.columns[columnId];
                const tasks = column.taskIds.map(
                  (taskId) => data.tasks[taskId]
                );

                return (
                  <Draggable
                    draggableId={column.id}
                    index={index}
                    key={column.id}
                  >
                    {(provided, snapshot) => (
                      <div
                        className={`column ${
                          snapshot.isDragging ? "is-dragging-column" : ""
                        }`}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <div
                          className="column-header"
                          {...provided.dragHandleProps}
                        >
                          <h2 className="column-title">{column.title}</h2>
                          <button
                            className="delete-column-btn"
                            onClick={() => handleDeleteColumn(column.id)}
                          >
                            ×
                          </button>
                        </div>

                        <Droppable droppableId={column.id} type="task">
                          {(provided, snapshot) => (
                            <div
                              className={`task-list ${
                                snapshot.isDraggingOver
                                  ? "is-dragging-over"
                                  : ""
                              }`}
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                            >
                              {tasks.map((task, index) => (
                                <Draggable
                                  key={task.id}
                                  draggableId={task.id}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      className={`task-card ${
                                        snapshot.isDragging ? "is-dragging" : ""
                                      }`}
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                    >
                                      {/* === YENİ: Kartın kendisine tıklama === */}
                                      <div
                                        className="card-content-wrapper"
                                        onClick={() =>
                                          handleOpenTaskModal(task, column.id)
                                        }
                                      >
                                        {task.content}
                                      </div>
                                      {/* === YENİ: Düzenle/Sil butonları === */}
                                      <div className="task-card-buttons">
                                        <button
                                          className="edit-task-btn"
                                          onClick={() =>
                                            handleOpenTaskModal(task, column.id)
                                          }
                                        >
                                          ✎
                                        </button>
                                        <button
                                          className="delete-task-btn"
                                          onClick={() =>
                                            handleDeleteTask(task.id, column.id)
                                          }
                                        >
                                          ×
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        <div className="add-task-container">
                          {addingTaskToColumn === column.id ? (
                            <AddTaskForm
                              columnId={column.id}
                              onAddTask={handleAddTask}
                              onCancel={() => setAddingTaskToColumn(null)}
                            />
                          ) : (
                            <button
                              className="add-task-btn"
                              onClick={() => setAddingTaskToColumn(column.id)}
                            >
                              + Kart ekle
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}

              <div className="add-column-wrapper">
                {isAddingColumn ? (
                  <AddColumnForm
                    onAddColumn={handleAddColumn}
                    onCancel={() => setIsAddingColumn(false)}
                  />
                ) : (
                  <button
                    className="add-column-btn"
                    onClick={() => setIsAddingColumn(true)}
                  >
                    + Başka bir liste ekleyin
                  </button>
                )}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* === YENİ: Modal'ı state'e göre render et === */}
      {isTaskModalOpen && (
        <TaskEditModal
          task={editingTaskInfo.task}
          column={editingTaskInfo.column}
          onClose={handleCloseTaskModal}
          onSave={handleTaskModalSave}
        />
      )}
    </>
  );
}

export default App;
