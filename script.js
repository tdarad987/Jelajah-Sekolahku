import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { addDoc, collection, getDocs, getFirestore, limit, orderBy, query, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

// Inisialisasi Firebase; jika konfigurasi belum diisi, fitur laporan memberi pesan yang jelas.
const configReady = Object.values(firebaseConfig).every((value) => value && !value.startsWith('ISI_'));
let db = null;
if (configReady) {
  try { db = getFirestore(initializeApp(firebaseConfig)); }
  catch (error) { console.error('Inisialisasi Firebase gagal:', error); }
}

// Satu sumber data untuk fasilitas; `gallery` berisi foto lokal untuk modal detail.
const places = [
  {name:'Gedung A',category:'Gedung',image:'Images/Gedung A.jpeg',gallery:['Images/Gedung A.jpeg','Images/Gedung A (Aula).jpeg','Images/Gedung A (Aula) 1.jpeg','Images/Gedung A (Lobby).jpeg'],description:'Salah satu gedung utama di lingkungan sekolah.',function:'Kegiatan belajar dan aktivitas sekolah.',area:'Area utama sekolah',hours:'Hari sekolah, mengikuti jadwal kegiatan',rules:'Jaga kebersihan dan gunakan ruang sesuai kebutuhan.',status:'Tersedia sesuai jadwal'},
  {name:'Parkiran',category:'Fasilitas Umum',image:'Images/Ruang Parkir Siswa.jpeg',gallery:['Images/Ruang Parkir Siswa.jpeg','Images/Ruang Parkir Siswi.jpeg'],description:'Area parkir untuk kendaraan warga sekolah.',function:'Tempat memarkir kendaraan dengan tertib.',area:'Area parkir sekolah',hours:'Hari sekolah',rules:'Parkir pada tempat yang ditentukan dan kunci kendaraan.',status:'Tersedia'},
  {name:'Taman Sekolah',category:'Fasilitas Umum',image:'Images/Taman Depan.jpeg',gallery:['Images/Taman Depan.jpeg','Images/Smk.png'],description:'Area hijau untuk mendukung lingkungan sekolah yang asri.',function:'Area penghijauan dan ruang santai.',area:'Lingkungan sekolah',hours:'Hari sekolah',rules:'Jaga tanaman dan kebersihan taman.',status:'Tersedia'},
  {name:'Masjid',category:'Tempat Ibadah',image:'Images/Masjid.jpeg',gallery:['Images/Masjid.jpeg'],description:'Fasilitas ibadah bagi warga sekolah.',function:'Tempat beribadah dan kegiatan keagamaan.',area:'Lingkungan sekolah',hours:'Menyesuaikan kegiatan sekolah',rules:'Jaga ketenangan, kebersihan, dan kesopanan.',status:'Tersedia'},
  {name:'Perpustakaan',category:'Fasilitas Umum',image:'Images/Perpus.jpeg',gallery:['Images/Perpustakaan.jpeg'],description:'Tempat membaca, mencari informasi, dan menambah wawasan.',function:'Mendukung literasi dan pembelajaran.',area:'Gedung sekolah',hours:'Mengikuti jadwal layanan sekolah',rules:'Jaga ketenangan dan kembalikan buku sesuai aturan.',status:'Tersedia sesuai jadwal'},
  {name:'Lapangan Upacara',category:'Lapangan',image:'Images/Lapangan Upacara.jpeg',gallery:['Images/Lapangan Upacara.jpeg'],description:'Area terbuka untuk upacara bendera dan kegiatan sekolah.',function:'Upacara, apel, dan kegiatan bersama.',area:'Area tengah sekolah',hours:'Mengikuti jadwal kegiatan',rules:'Gunakan dengan tertib dan jaga kebersihan.',status:'Tersedia sesuai jadwal'},
  {name:'Lapangan Tengah',category:'Lapangan',image:'Images/Lapangan Wirya Khsetra.jpeg',gallery:['Images/Lapangan Wirya Khsetra.jpeg'],description:'Area terbuka di lingkungan sekolah.',function:'Kegiatan luar ruang dan aktivitas warga sekolah.',area:'Area tengah sekolah',hours:'Hari sekolah',rules:'Gunakan sesuai arahan sekolah.',status:'Tersedia sesuai jadwal'},
  {name:'Lapangan Basket',category:'Lapangan',image:'Images/Lapangan Basket.jpeg',gallery:['Images/Lapangan Basket.jpeg'],description:'Fasilitas olahraga untuk permainan bola basket.',function:'Olahraga dan latihan bola basket.',area:'Area olahraga sekolah',hours:'Mengikuti jadwal penggunaan',rules:'Gunakan perlengkapan dengan aman dan bergantian.',status:'Tersedia sesuai jadwal'},
  {name:'Gedung Animax',category:'Gedung',image:'Images/Animax.jpeg',gallery:['Images/Animax.jpeg','Images/Teras Studio.jpeg','Images/Teras Studio Dalam.jpeg'],description:'Salah satu gedung yang menjadi bagian lingkungan sekolah. Di lantai atas terdapat Teras Studio.',function:'Ruang kegiatan sekolah sesuai peruntukan. Lantai atas: Teras Studio untuk kegiatan kreatif.',area:'Kompleks gedung sekolah',hours:'Hari sekolah',rules:'Ikuti arahan petugas dan jaga fasilitas.',status:'Tersedia sesuai jadwal'},
  {name:'Lab DKV',category:'Laboratorium',image:'Images/Tefa Dkv.jpeg',gallery:['Images/Tefa Dkv.jpeg','Images/Tefa Dkv Dalam.jpeg',],description:'Ruang praktik yang berkaitan dengan Desain Komunikasi Visual.',function:'Praktik dan pembelajaran bidang DKV.',area:'Area ruang praktik',hours:'Sesuai jadwal pembelajaran',rules:'Gunakan alat dengan arahan guru dan rapikan kembali.',status:'Tersedia sesuai jadwal'},
  {name:'Lab GIM',category:'Laboratorium',image:'Images/Lab Gim Depan.jpeg',gallery:['Images/Lab Gim Depan.jpeg','Images/Lab Gim.jpeg'],description:'Tempat praktik bidang pengembangan gim.',function:'Praktik dan pembelajaran pengembangan gim.',area:'Area ruang praktik',hours:'Sesuai jadwal pembelajaran',rules:'Gunakan perangkat sesuai arahan guru.',status:'Tersedia sesuai jadwal'},
  {name:'Lab Bahasa',category:'Laboratorium',image:'Images/Perpustakaan.jpeg',gallery:['Images/Perpustakaan.jpeg'],description:'Fasilitas pembelajaran praktik dan pengembangan kemampuan berbahasa.',function:'Pembelajaran bahasa dan latihan komunikasi.',area:'Area ruang belajar',hours:'Sesuai jadwal pembelajaran',rules:'Jaga ketenangan dan perangkat pembelajaran.',status:'Tersedia sesuai jadwal'},
  {name:'TEFA DKV',category:'Laboratorium',image:'Images/Tefa Dkv.jpeg',gallery:['Images/Tefa Dkv.jpeg','Images/Gallery Karya.jpeg','Images/Teras Studio.jpeg','Images/Teras Studio Dalam.jpeg'],description:'Ruang Teaching Factory yang berkaitan dengan praktik DKV.',function:'Praktik dan proyek bidang DKV.',area:'Area ruang praktik',hours:'Sesuai jadwal kegiatan',rules:'Gunakan alat dengan pengawasan dan rapikan ruang.',status:'Tersedia sesuai jadwal'},
  {name:'TEFA PPLG',category:'Laboratorium',image:'Images/Tefa PPLG.jpeg',gallery:['Images/Tefa PPLG.jpeg','Images/Ruang Tefa PPLG Dalam.jpeg'],description:'Ruang Teaching Factory bidang pengembangan perangkat lunak dan gim.',function:'Praktik dan proyek bidang PPLG.',area:'Area ruang praktik',hours:'Sesuai jadwal kegiatan',rules:'Gunakan perangkat sesuai arahan guru.',status:'Tersedia sesuai jadwal'},
  {name:'TEFA TG',category:'Laboratorium',image:'Images/Ruang Tefa TG Luar.jpeg',gallery:['Images/Ruang Tefa TG Luar.jpeg','Images/Ruang Tefa TG Dalam.jpeg','Images/Ruang Tefa TG Dalam 2.jpeg','Images/Ruang Tefa TG Dalam 3.jpeg'],description:'Ruang Teaching Factory yang menjadi bagian fasilitas praktik.',function:'Kegiatan praktik sesuai program pembelajaran.',area:'Area ruang praktik',hours:'Sesuai jadwal kegiatan',rules:'Ikuti arahan guru dan jaga kelengkapan ruang.',status:'Tersedia sesuai jadwal'},
  {name:'Gedung O',category:'Gedung',image:'Images/Gedung O.jpeg',gallery:['Images/Gedung O.jpeg'],description:'Gedung O merupakan salah satu gedung di kompleks sekolah.',function:'Ruang kegiatan belajar mengajar dan aktivitas sekolah.',area:'Kompleks gedung sekolah',hours:'Hari sekolah, mengikuti jadwal kegiatan',rules:'Jaga kebersihan dan gunakan ruang sesuai kebutuhan.',status:'Tersedia sesuai jadwal'},
  {name:'Gedung M',category:'Gedung',image:'Images/Gedung M.jpeg',gallery:['Images/Gedung M.jpeg'],description:'Gedung M merupakan salah satu gedung di lingkungan sekolah.',function:'Ruang kegiatan belajar mengajar dan aktivitas sekolah.',area:'Kompleks gedung sekolah',hours:'Hari sekolah, mengikuti jadwal kegiatan',rules:'Jaga kebersihan dan gunakan ruang sesuai kebutuhan.',status:'Tersedia sesuai jadwal'},
  {name:'Gedung N',category:'Gedung',image:'Images/Gedung N.jpeg',gallery:['Images/Gedung N.jpeg'],description:'Gedung N merupakan salah satu gedung di lingkungan sekolah.',function:'Ruang kegiatan belajar mengajar dan aktivitas sekolah.',area:'Kompleks gedung sekolah',hours:'Hari sekolah, mengikuti jadwal kegiatan',rules:'Jaga kebersihan dan gunakan ruang sesuai kebutuhan.',status:'Tersedia sesuai jadwal'},
  {name:'Gedung P',category:'Gedung',image:'Images/Gedung V.jpeg',gallery:['Images/Gedung V.jpeg'],description:'Gedung P merupakan salah satu gedung di lingkungan sekolah.',function:'Ruang kegiatan belajar mengajar dan aktivitas sekolah.',area:'Kompleks gedung sekolah',hours:'Hari sekolah, mengikuti jadwal kegiatan',rules:'Jaga kebersihan dan gunakan ruang sesuai kebutuhan.',status:'Tersedia sesuai jadwal'},
  {name:'Gedung D',category:'Gedung',image:'Images/Gedung D.jpeg',gallery:['Images/Gedung D.jpeg'],description:'Gedung D digunakan sebagai ruang guru jurusan Teknik Grafika (TG).',function:'Ruang guru TG untuk koordinasi, administrasi, dan kegiatan pengajaran.',area:'Kompleks gedung sekolah',hours:'Hari sekolah, mengikuti jadwal kegiatan',rules:'Jaga ketenangan, kebersihan, dan sopan santun saat memasuki ruang guru.',status:'Tersedia sesuai jadwal'},
  {name:'Lobby',category:'Fasilitas Umum',image:'Images/Gedung A (Lobby).jpeg',gallery:['Images/Gedung A (Lobby).jpeg'],description:'Area lobby utama sebagai tempat penerimaan tamu dan pusat informasi sekolah.',function:'Penerimaan tamu, pusat informasi, dan area tunggu.',area:'Area depan gedung utama',hours:'Hari sekolah',rules:'Jaga ketenangan dan kebersihan area lobby.',status:'Tersedia'},
  {name:'Teras Studio',category:'Gedung',image:'Images/Teras Studio.jpeg',gallery:['Images/Teras Studio.jpeg','Images/Teras Studio Dalam.jpeg'],description:'Teras Studio berada di lantai atas Gedung Animax, digunakan sebagai ruang kreatif dan kegiatan studio.',function:'Ruang kegiatan kreatif, studio, dan praktik.',area:'Lantai atas Gedung Animax',hours:'Sesuai jadwal kegiatan',rules:'Gunakan peralatan dengan hati-hati dan rapikan kembali setelah digunakan.',status:'Tersedia sesuai jadwal'},
  {name:'Ruang Gallery',category:'Fasilitas Umum',image:'Images/Gallery Depan.jpeg',gallery:['Images/Gallery Depan','Images/Gallery Karya.jpeg','Images/Gallery 1.jpeg','Images/Gallery 2.jpeg','Images/Gallery Dalam 3.jpeg'],description:'Ruang Gallery digunakan untuk menyimpan dan memamerkan karya-karya siswa. Terletak di lantai 1 Gedung Animax.',function:'Penyimpanan dan pameran hasil karya siswa.',area:'Lantai 1 Gedung Animax',hours:'Hari sekolah, mengikuti jadwal kegiatan',rules:'Jangan menyentuh karya yang dipajang tanpa izin dan jaga kebersihan ruangan.',status:'Tersedia sesuai jadwal'},
  {name:'Kantin',category:'Fasilitas Umum',image:'Images/Kantin.jpeg',gallery:['Images/Kantin.jpeg','Images/Kantin Dalam.jpeg'],description:'Kantin sekolah menyediakan makanan dan minuman untuk warga sekolah.',function:'Tempat jual beli makanan dan minuman.',area:'Area kantin sekolah',hours:'Hari sekolah, jam istirahat',rules:'Buang sampah pada tempatnya, antre dengan tertib, dan jaga kebersihan meja.',status:'Tersedia'},
  {name:'UKS',category:'Fasilitas Umum',image:'Images/UKS.jpeg',gallery:['Images/UKS.jpeg','Images/UKS Dalam.jpeg','Images/UKS Dalam 1.jpeg'],description:'Unit Kesehatan Sekolah (UKS) sebagai fasilitas pertolongan pertama dan perawatan kesehatan ringan bagi warga sekolah.',function:'Pertolongan pertama, pemeriksaan kesehatan ringan, dan tempat istirahat siswa yang sakit.',area:'Lingkungan gedung sekolah',hours:'Hari sekolah',rules:'Gunakan fasilitas sesuai kebutuhan, lapor ke petugas, dan jaga kebersihan ruangan.',status:'Tersedia'},
  {name:'Koperasi',category:'Fasilitas Umum',image:'Images/Koperasi Dalam.jpeg',gallery:['Images/Koperasi Dalam.jpeg'],description:'Koperasi sekolah menyediakan kebutuhan alat tulis dan perlengkapan sekolah bagi siswa.',function:'Penjualan alat tulis, seragam, dan kebutuhan sekolah lainnya.',area:'Lingkungan gedung sekolah',hours:'Hari sekolah, jam istirahat',rules:'Antre dengan tertib dan bayar sesuai harga yang tertera.',status:'Tersedia'},
  {name: "Gedung E",category: "Gedung",image: "Images/Gedung E.jpeg",gallery: ['Images/Gedung E.jpeg'],description: 'Gedung E merupakan salah satu fasilitas pembelajaran di SMKN 11 Semarang yang digunakan sebagai laboratorium komputer untuk mendukung kegiatan praktik dan pembelajaran siswa jurusan Teknik Grafika.',function: 'Laboratorium komputer untuk kegiatan pembelajaran, praktik desain grafis, pengolahan gambar, serta penggunaan perangkat lunak yang berkaitan dengan bidang Teknik Grafika.',area: 'Gedung E',hours: 'Sesuai jadwal pembelajaran dan kegiatan praktik',rules: ['Gunakan komputer sesuai kebutuhan pembelajaran.','Jaga kebersihan dan kerapian laboratorium.','Dilarang mengubah pengaturan komputer tanpa izin.','Gunakan perangkat dengan hati-hati.','Ikuti arahan guru atau petugas laboratorium.'],status: 'Digunakan untuk kegiatan pembelajaran'},
];


const $ = (selector) => document.querySelector(selector);
const placesContainer = $('#places-container');
const searchInput = $('#search-input');
let activeCategory = 'Semua';
let previousFocus = null;
let activeGallery = [];
let activeGalleryIndex = 0;
let activePlace = null;

// Statistik dihitung dari data, sehingga perubahan daftar ikut terhitung.
function renderStats() {
  $('#stat-total').textContent = places.length;
  $('#stat-labs').textContent = places.filter((place) => place.category === 'Laboratorium').length;
  $('#stat-fields').textContent = places.filter((place) => place.category === 'Lapangan').length;
  $('#stat-buildings').textContent = places.filter((place) => ['Gedung', 'Fasilitas Umum'].includes(place.category)).length;
}

function renderPlaces() {
  const query = searchInput.value.trim().toLocaleLowerCase('id');
  const filtered = places.filter((place) => (activeCategory === 'Semua' || place.category === activeCategory) &&
    `${place.name} ${place.category} ${place.description} ${place.function}`.toLocaleLowerCase('id').includes(query));
  placesContainer.replaceChildren();
  filtered.forEach((place) => {
    const index = places.indexOf(place) + 1;
    const card = document.createElement('article');
    card.className = 'place-card';
    const image = document.createElement('img');
    image.src = place.image; image.alt = `Foto ${place.name}`; image.loading = 'lazy';
    image.addEventListener('error', () => { image.classList.add('image-missing'); image.alt = `Foto ${place.name} tidak tersedia`; }, {once:true});
    const info = document.createElement('div'); info.className = 'place-info';
    const number = document.createElement('span'); number.className = 'place-number'; number.textContent = `LOCATION ${String(index).padStart(2,'0')}`;
    const category = document.createElement('span'); category.className = 'category-tag'; category.textContent = place.category;
    const title = document.createElement('h3'); title.textContent = place.name;
    const desc = document.createElement('p'); desc.textContent = place.description;
    const button = document.createElement('button'); button.className = 'detail-btn'; button.type = 'button'; button.textContent = 'Lihat Detail →'; button.addEventListener('click', () => showDetail(place));
    info.append(number, category, title, desc, button); card.append(image, info); placesContainer.append(card);
  });
  $('#result-status').textContent = `Menampilkan ${filtered.length} dari ${places.length} lokasi`;
  $('#no-result').hidden = filtered.length > 0;
}

function showDetail(place) {
  previousFocus = document.activeElement;
  activePlace = place;
  // Setiap fasilitas memulai galeri dari foto pertama; foto utama menjadi fallback.
  activeGallery = place.gallery?.length ? place.gallery : [place.image];
  activeGalleryIndex = 0;
  renderGallery(place);
  $('#modal-category').textContent = place.category;
  $('#modal-title').textContent = place.name;
  $('#modal-description').textContent = place.description;
  $('#modal-function').textContent = place.function;
  $('#modal-area').textContent = place.area;
  $('#modal-hours').textContent = place.hours;
  $('#modal-rules').textContent = place.rules;
  $('#modal-status').textContent = place.status;
  $('#place-modal').classList.add('show');
  $('#place-modal').setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  $('#close-modal').focus();
}

// Render foto utama, indikator, thumbnail, dan status tombol untuk lokasi aktif.
function renderGallery(place) {
  const image = $('#modal-image');
  const photoCount = activeGallery.length;
  const thumbnails = $('#gallery-thumbnails');
  image.onerror = () => {
    image.onerror = null;
    image.src = place.image;
  };
  image.src = activeGallery[activeGalleryIndex] || place.image;
  image.alt = `Foto ${place.name}, ${activeGalleryIndex + 1} dari ${photoCount}`;
  $('#gallery-counter').textContent = `${activeGalleryIndex + 1} / ${photoCount}`;
  $('#gallery-prev').hidden = photoCount <= 1;
  $('#gallery-next').hidden = photoCount <= 1;
  thumbnails.replaceChildren();

  activeGallery.forEach((photo, index) => {
    const thumbnail = document.createElement('button');
    thumbnail.type = 'button';
    thumbnail.className = 'gallery-thumbnail';
    thumbnail.setAttribute('aria-label', `Tampilkan foto ${index + 1} dari ${photoCount}`);
    thumbnail.setAttribute('aria-pressed', String(index === activeGalleryIndex));
    if (index === activeGalleryIndex) thumbnail.classList.add('active');
    const thumbnailImage = document.createElement('img');
    thumbnailImage.src = photo;
    thumbnailImage.alt = '';
    thumbnailImage.onerror = () => { thumbnailImage.onerror = null; thumbnailImage.src = place.image; };
    thumbnail.append(thumbnailImage);
    thumbnail.addEventListener('click', () => setGalleryPhoto(index, place));
    thumbnails.append(thumbnail);
  });
}

// Pindah foto dengan indeks melingkar agar navigasi dari ujung tetap praktis.
function setGalleryPhoto(index, place) {
  activeGalleryIndex = (index + activeGallery.length) % activeGallery.length;
  renderGallery(place);
}

function moveGalleryPhoto(direction) {
  if (activePlace && activeGallery.length > 1) setGalleryPhoto(activeGalleryIndex + direction, activePlace);
}

function hideModal() {
  const modal = $('#place-modal');
  if (!modal.classList.contains('show')) return;
  modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open');
  if (previousFocus) previousFocus.focus();
}

// Isi pilihan laporan dari direktori lokasi.
places.forEach((place) => { const option = document.createElement('option'); option.value = place.name; option.textContent = place.name; $('#report-location').append(option); });

const reportsCollection = db ? collection(db, 'laporan_fasilitas') : null;

// Query selalu dibatasi lima dokumen agar sesuai dengan aturan akses prototype.
async function renderReports() {
  const list = $('#report-list');
  list.replaceChildren();
  if (!db) {
    $('#report-count').textContent = '0';
    addReportNotice(configReady ? 'Firebase gagal diinisialisasi. Periksa konfigurasi dan koneksi.' : 'Konfigurasi Firebase belum diisi. Lengkapi firebase-config.js untuk memuat laporan.', 'empty-reports');
    return;
  }
  try {
    const latestQuery = query(reportsCollection, orderBy('createdAt', 'desc'), limit(5));
    const snapshot = await getDocs(latestQuery);
    $('#report-count').textContent = snapshot.size;
    snapshot.forEach((documentSnapshot) => {
      const report = documentSnapshot.data();
      const item = document.createElement('li');
      const title = document.createElement('strong'); title.textContent = `${report.jenisLaporan} · ${report.lokasi}`;
      const description = document.createElement('p'); description.textContent = report.deskripsi;
      const reporter = document.createElement('small'); reporter.textContent = report.namaPelapor;
      item.append(title, description, reporter); list.append(item);
    });
    if (!snapshot.size) addReportNotice('Belum ada laporan tersimpan.', 'empty-reports');
  } catch (error) {
    console.error('Gagal memuat laporan Firestore:', error);
    $('#report-count').textContent = '0';
    addReportNotice('Laporan gagal dimuat. Periksa koneksi internet dan Firestore Rules, lalu muat ulang halaman.', 'empty-reports');
  }
}

function addReportNotice(message, className) {
  const item = document.createElement('li'); item.className = className; item.textContent = message;
  $('#report-list').append(item);
}

$('#report-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget; const data = new FormData(form);
  const reporter = String(data.get('reporter') || '').trim();
  const location = String(data.get('location')).trim();
  const type = String(data.get('type')).trim();
  const description = String(data.get('description')).trim();
  const missing = [];
  if (!reporter) missing.push({ message: 'Nama pelapor wajib diisi.', selector: '[name="reporter"]' });
  if (!location) missing.push({ message: 'Lokasi wajib dipilih.', selector: '[name="location"]' });
  if (!type) missing.push({ message: 'Jenis laporan wajib dipilih.', selector: '[name="type"]' });
  if (!description) missing.push({ message: 'Deskripsi wajib diisi.', selector: '[name="description"]' });
  if (missing.length) {
    $('#form-message').textContent = missing.map((item) => item.message).join(' ');
    form.querySelector(missing[0].selector).focus();
    return;
  }
  if (!db) {
    $('#form-message').textContent = configReady ? 'Firebase tidak dapat diinisialisasi. Periksa konfigurasi dan koneksi.' : 'Laporan belum dikirim: lengkapi konfigurasi Firebase di firebase-config.js.';
    return;
  }
  const submitButton = form.querySelector('[type="submit"]'); submitButton.disabled = true;
  $('#form-message').textContent = 'Mengirim laporan...';
  try {
    await addDoc(reportsCollection, {
      namaPelapor: reporter,
      lokasi: location,
      jenisLaporan: type,
      deskripsi: description,
      createdAt: serverTimestamp()
    });
    form.reset();
    $('#form-message').textContent = 'Terima kasih, laporan berhasil tersimpan.';
    await renderReports();
  } catch (error) {
    console.error('Gagal menyimpan laporan Firestore:', error);
    $('#form-message').textContent = 'Laporan gagal disimpan. Periksa koneksi internet, konfigurasi Firebase, dan Firestore Rules, lalu coba lagi.';
  } finally {
    submitButton.disabled = false;
  }
});

searchInput.addEventListener('input', renderPlaces);
document.querySelectorAll('.filter-btn').forEach((button) => button.addEventListener('click', () => {
  activeCategory = button.dataset.category;
  document.querySelectorAll('.filter-btn').forEach((item) => { const selected = item === button; item.classList.toggle('active', selected); item.setAttribute('aria-pressed', String(selected)); });
  renderPlaces();
}));
document.querySelectorAll('.map-marker').forEach((button) => button.addEventListener('click', () => {
  const place = places.find((item) => item.name === button.dataset.place); if (place) showDetail(place);
}));
$('#close-modal').addEventListener('click', hideModal);
$('#gallery-prev').addEventListener('click', () => moveGalleryPhoto(-1));
$('#gallery-next').addEventListener('click', () => moveGalleryPhoto(1));
$('#place-modal').addEventListener('click', (event) => { if (event.target === event.currentTarget) hideModal(); });
document.addEventListener('keydown', (event) => {
  // Panah kiri/kanan mengubah foto hanya saat dialog detail sedang terbuka.
  if ($('#place-modal').classList.contains('show') && event.key === 'ArrowLeft') { event.preventDefault(); moveGalleryPhoto(-1); }
  if ($('#place-modal').classList.contains('show') && event.key === 'ArrowRight') { event.preventDefault(); moveGalleryPhoto(1); }
  if (event.key === 'Escape') { hideModal(); $('#nav-menu').classList.remove('show'); $('#menu-toggle').setAttribute('aria-expanded', 'false'); }
  if (event.key === 'Tab' && $('#place-modal').classList.contains('show')) {
    const close = $('#close-modal'); if (event.shiftKey && document.activeElement === close) { event.preventDefault(); close.focus(); }
  }
});
$('#menu-toggle').addEventListener('click', () => {
  const menu = $('#nav-menu'); const open = menu.classList.toggle('show'); $('#menu-toggle').setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('#nav-menu a').forEach((link) => link.addEventListener('click', () => { $('#nav-menu').classList.remove('show'); $('#menu-toggle').setAttribute('aria-expanded', 'false'); }));

// Tandai tautan navigasi yang section-nya sedang terlihat.
const sectionLinks = [...document.querySelectorAll('#nav-menu a')];
const observedSections = sectionLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach((link) => {
        const isActive = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });
  observedSections.forEach((section) => sectionObserver.observe(section));
} else {
  sectionLinks[0]?.classList.add('active');
}

renderStats(); renderPlaces(); renderReports();
