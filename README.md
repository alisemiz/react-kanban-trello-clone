#  Kanban Proje Yönetim Panosu (React + Firebase)

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Full_Stack-orange?logo=firebase)
![Drag & Drop](https://img.shields.io/badge/Drag%26Drop-%40hello--pangea-brightgreen)
![Lisans](https://img.shields.io/badge/license-MIT-blue.svg)

Bu proje, **React.js** (Hooks & Context API) ve **Firebase** (Firestore, Auth) kullanılarak sıfırdan oluşturulmuş, Trello benzeri, gerçek zamanlı ve tam özellikli bir Kanban (Proje Yönetim) panosudur.

Uygulama, modern React özelliklerini ve sunucusuz (serverless) bir backend mimarisini sergilemek amacıyla geliştirilmiştir. En önemli özelliği, hem kartlar (dikey) hem de sütunlar (yatay) için pürüzsüz **Sürükle-Bırak (Drag & Drop)** işlevselliğidir.

> **Canlı Demo:** https://kanban-projesi-react.web.app

## Görseller
---

<img width="1914" height="642" alt="Ekran görüntüsü 2025-10-31 173100" src="https://github.com/user-attachments/assets/d29addbc-444a-49ba-891b-a5be65173ac6" />
<img width="500" height="667" alt="Ekran görüntüsü 2025-10-31 173108" src="https://github.com/user-attachments/assets/747c51d9-cec5-4550-82f2-1825b29693d5" />



---

## ✨ Temel Özellikler

Bu proje, basit bir "To-Do" listesinden çok daha fazlasıdır:

* **Güvenli Kimlik Doğrulama (Firebase Auth):**
    * E-posta ve şifre ile kullanıcı kaydı ve girişi.
    * Oturum yönetimi (`onAuthStateChanged`) ile kalıcı giriş.

* **Gerçek Zamanlı Veritabanı (Firestore):**
    * Kullanıcı giriş yaptığında, o kullanıcıya ait pano verisi (`onSnapshot` ile) gerçek zamanlı olarak yüklenir.
    * Yeni kullanıcılar için otomatik olarak bir "Hoş Geldiniz" panosu oluşturulur.

* **Gelişmiş Sürükle-Bırak (Drag & Drop):**
    * **`@hello-pangea/dnd`** kütüphanesi (eski `react-beautiful-dnd`) kullanılarak React 19+ ile tam uyumluluk.
    * **Kart Sürükleme:** Kartları aynı sütun içinde (sıralama) veya sütunlar arasında (durum değiştirme) sürükleyebilme.
    * **Sütun Sürükleme:** Sütunların tamamını yatayda sürükleyerek pano düzenini değiştirebilme.

* **Tam Dinamik CRUD İşlevselliği:**
    * **Sütun (Liste) Yönetimi:** Yeni sütunlar (`+ Başka bir liste ekleyin`) ekleme ve mevcut sütunları (içindeki tüm kartlarla birlikte) silme.
    * **Kart (Görev) Yönetimi:** Herhangi bir sütuna yeni kartlar ekleme ve mevcut kartları silme.
    * **Kart Düzenleme:** Kartlara tıklandığında açılan "Buzlu Cam" (Glassmorphism) efektli bir **Modal (Pop-up)** üzerinden kart başlığını ve açıklamasını düzenleyebilme.

* **Kalıcı (Persistent) State:**
    * Yapılan **her değişiklik** (kart sürükleme, sütun sıralama, kart ekleme/silme, kart içeriğini güncelleme) anında Firestore veritabanına kaydedilir.
    * Sayfa yenilendiğinde veya kullanıcı çıkış yapıp tekrar girdiğinde pano tam olarak kaldığı yerden devam eder.

* **Güvenli Firestore Kuralları:**
    * Arka uçta uygulanan kurallar sayesinde, bir kullanıcı **sadece ve sadece kendi `userId`'sine sahip** panoyu okuyabilir, oluşturabilir, güncelleyebilir veya silebilir. Başka bir kullanıcının verisine erişim imkansızdır.

---

## 🛠️ Kullanılan Teknolojiler

| Kategori | Teknoloji | Amaç |
| :--- | :--- | :--- |
| **Frontend** | `React.js` (v19) | Modern, bileşen (component) tabanlı arayüz. `useState` ve `useEffect` hook'ları ile state yönetimi. |
| **Sürükle & Bırak** | `@hello-pangea/dnd` | `react-beautiful-dnd`'nin React 19+ uyumlu fork'u. Kart ve sütun sürükleme mantığı. |
| **Backend** | `Firebase (Sunucusuz)` | Veritabanı, kimlik doğrulama ve güvenlik işlemlerini yöneten platform. |
| **Veritabanı** | `Google Firestore` | Gerçek zamanlı NoSQL veritabanı. Pano (`boardData`) objesini tek bir dokümanda tutar. |
| **Güvenlik** | `Firebase Auth` & `Security Rules` | Kullanıcı oturumları ve "sadece sahibi erişebilir" kuralı. |
| **Yardımcılar** | `uuid` | Yeni kartlar ve sütunlar için benzersiz ID'ler oluşturma. |
| **Geliştirme** | `Vite.js` | Hızlı geliştirme sunucusu ve React projesi kurulumu. |

---

## 🚀 Yerel Kurulum ve Çalıştırma

Projeyi kendi bilgisayarınızda çalıştırmak için:

1.  **Gereksinimler:**
    * [Node.js](https://nodejs.org/tr/) (npm'i içerir)
    * [Git](https://git-scm.com/)

2.  **Depoyu Klonlayın:**
    ```bash
    git clone https://github.com/alisemiz/react-kanban-trello-clone.git
    cd react-kanban-trello-clone
    ```

3.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```

4.  **Firebase Proje Yapılandırması:**
    * Kendi Firebase projenizi oluşturun ve bir **Web Uygulaması** kaydedin.
    * `Authentication` (E-posta/Şifre) ve `Firestore Database` servislerini (Test Modunda) etkinleştirin.
    * Oluşturulan `firebaseConfig` objesini kopyalayın.
    * Projedeki `src/firebase.js` dosyasını açın ve `const firebaseConfig = { ... };` bloğunu kendi config bilgilerinizle değiştirin.

5.  **Güvenlik Kuralları:**
    * Firebase konsolunda **Firestore Database > Rules** sekmesine gidin.
    * Bu projenin tam güvenli çalışması için `README` dosyasının altındaki **Güvenlik Mimarisi** bölümünde yer alan kuralları kopyalayıp yapıştırın ve yayınlayın.

6.  **Uygulamayı Başlatma:**
    ```bash
    npm run dev
    ```
    * Tarayıcınızda `http://localhost:5173/` adresini açın.

---

## 🔐 Güvenlik Mimarisi

Bu projenin güvenliği, Firestore Güvenlik Kuralları ile sağlanmaktadır. Kullanıcıların verilere sadece arayüzden değil, doğrudan API'den erişmeye çalışması durumunda bile koruma sağlar.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
  
    // 'boards' koleksiyonu için kurallar
    match /boards/{boardId} {
    
      // Bir kullanıcı, SADECE kendi 'userId'sine sahip panoyu
      // okuyabilir, oluşturabilir, güncelleyebilir veya silebilir.
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      
      // 'create' (oluşturma) için ekstra kontrol:
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
