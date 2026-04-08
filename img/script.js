// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let servicesData = null;

// ========== БЕЗОПАСНАЯ РАБОТА С LOCALSTORAGE ==========
function safeGetSubmissions() {
    try {
        const rawData = localStorage.getItem('formSubmissions');
        if (!rawData) {
            return [];
        }
        const parsed = JSON.parse(rawData);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        return [];
    } catch (e) {
        console.error('Ошибка чтения formSubmissions:', e);
        return [];
    }
}

function safeSetSubmissions(submissions) {
    try {
        localStorage.setItem('formSubmissions', JSON.stringify(submissions));
        return true;
    } catch (e) {
        console.error('Ошибка сохранения formSubmissions:', e);
        return false;
    }
}

// ========== ЗАГРУЗКА КАТАЛОГА ИЗ JSON ==========
async function loadCatalog() {
    try {
        const response = await fetch('data/services.json');
        
        if (!response.ok) {
            throw new Error('Файл services.json не найден!');
        }
        
        servicesData = await response.json();
        
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (categoriesGrid && servicesData.categories) {
            categoriesGrid.innerHTML = '';
            
            servicesData.categories.forEach((cat, index) => {
                const card = document.createElement('div');
                card.className = 'catalog-card catalog-card--featured glass';
                card.setAttribute('data-category-id', cat.id);
                card.setAttribute('data-category-index', index);
                
                card.innerHTML = `
                    <div class="catalog-card-image">
                        <div style="background: linear-gradient(135deg, #1E3A8A, #2b4c9e); height: 200px; display: flex; align-items: center; justify-content: center;">
                            <i class="fas ${cat.icon}" style="font-size: 4rem; color: #FFB200;"></i>
                        </div>
                        <div class="catalog-card-overlay">
                            <span class="catalog-badge">${cat.services[0]?.price || 'от 500 ₽'}</span>
                        </div>
                    </div>
                    <div class="catalog-card-content">
                        <div class="catalog-header">
                            <i class="fas ${cat.icon} catalog-icon"></i>
                            <h3>${escapeHtml(cat.name)}</h3>
                        </div>
                        <p>${escapeHtml(cat.description)}</p>
                        <div class="catalog-features">
                            <span><i class="fas fa-check"></i> ${cat.services.length} услуг</span>
                            <span><i class="fas fa-check"></i> Индивидуально</span>
                        </div>
                        <button class="catalog-link view-services-btn" data-category-index="${index}">
                            Смотреть услуги <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                `;
                
                categoriesGrid.appendChild(card);
            });
        }
        
        document.querySelectorAll('.view-services-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryIndex = btn.getAttribute('data-category-index');
                if (servicesData && servicesData.categories[categoryIndex]) {
                    showServicesModal(servicesData.categories[categoryIndex]);
                } else {
                    showNotification('Ошибка загрузки услуг', 'error');
                }
            });
        });
        
        console.log('✅ Каталог загружен успешно');
        
    } catch (error) {
        console.error('Ошибка загрузки каталога:', error);
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (categoriesGrid) {
            categoriesGrid.innerHTML = `
                <div class="catalog-card glass" style="grid-column: span 3; text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #FFB200; margin-bottom: 20px;"></i>
                    <h3>Не удалось загрузить каталог</h3>
                    <p>Проверьте: папка data и файл services.json</p>
                    <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 20px;">Обновить</button>
                </div>
            `;
        }
    }
}

// ========== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ==========
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ========== МОДАЛЬНОЕ ОКНО С УСЛУГАМИ ==========
function showServicesModal(category) {
    const modal = document.getElementById('servicesModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalList = document.getElementById('modalServicesList');
    
    if (!modal || !modalTitle || !modalList) return;
    
    modalTitle.innerHTML = `<i class="fas ${category.icon}"></i> ${escapeHtml(category.name)}`;
    modalList.innerHTML = '';
    
    category.services.forEach(service => {
        const serviceItem = document.createElement('div');
        serviceItem.className = 'service-item';
        serviceItem.innerHTML = `
            <div class="service-info">
                <h4>${escapeHtml(service.name)}</h4>
                <p>${escapeHtml(service.description)}</p>
                <span class="service-price">${escapeHtml(service.price)}</span>
            </div>
            <button class="btn-order-service" data-service="${escapeHtml(service.name)}">
                Заказать <i class="fas fa-shopping-cart"></i>
            </button>
        `;
        modalList.appendChild(serviceItem);
    });
    
    modal.style.display = 'flex';
    
    document.querySelectorAll('.btn-order-service').forEach(btn => {
        btn.addEventListener('click', () => {
            const serviceName = btn.getAttribute('data-service');
            const serviceSelect = document.getElementById('service');
            if (serviceSelect) {
                let found = false;
                for (let i = 0; i < serviceSelect.options.length; i++) {
                    if (serviceSelect.options[i].value === serviceName || 
                        serviceSelect.options[i].text === serviceName) {
                        serviceSelect.selectedIndex = i;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    const option = document.createElement('option');
                    option.value = serviceName;
                    option.text = serviceName;
                    serviceSelect.appendChild(option);
                    serviceSelect.value = serviceName;
                }
            }
            modal.style.display = 'none';
            const orderSection = document.getElementById('order');
            if (orderSection) {
                orderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            showNotification(`Вы выбрали: ${serviceName}`, 'success');
        });
    });
}

// ========== ПОИСК ==========
function searchServices(query) {
    if (!servicesData || !servicesData.categories) return [];
    if (!query.trim()) return [];
    
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    servicesData.categories.forEach(category => {
        category.services.forEach(service => {
            if (service.name.toLowerCase().includes(lowerQuery) || 
                service.description.toLowerCase().includes(lowerQuery)) {
                results.push({
                    ...service,
                    categoryName: category.name
                });
            }
        });
    });
    
    return results;
}

function showSearchModal(query) {
    const results = searchServices(query);
    const modal = document.getElementById('searchModal');
    const resultsContainer = document.getElementById('searchResults');
    
    if (!modal || !resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="service-item">
                <div class="service-info">
                    <h4>😕 Ничего не найдено</h4>
                    <p>Попробуйте другое слово для поиска</p>
                </div>
            </div>`;
    } else {
        results.forEach(service => {
            const serviceItem = document.createElement('div');
            serviceItem.className = 'service-item';
            serviceItem.innerHTML = `
                <div class="service-info">
                    <h4>${escapeHtml(service.name)}</h4>
                    <p><small>${escapeHtml(service.categoryName)}</small> — ${escapeHtml(service.description)}</p>
                    <span class="service-price">${escapeHtml(service.price)}</span>
                </div>
                <button class="btn-order-service" data-service="${escapeHtml(service.name)}">
                    Заказать <i class="fas fa-shopping-cart"></i>
                </button>
            `;
            resultsContainer.appendChild(serviceItem);
        });
    }
    
    modal.style.display = 'flex';
    
    document.querySelectorAll('#searchModal .btn-order-service').forEach(btn => {
        btn.addEventListener('click', () => {
            const serviceName = btn.getAttribute('data-service');
            const serviceSelect = document.getElementById('service');
            if (serviceSelect) {
                let found = false;
                for (let i = 0; i < serviceSelect.options.length; i++) {
                    if (serviceSelect.options[i].value === serviceName || 
                        serviceSelect.options[i].text === serviceName) {
                        serviceSelect.selectedIndex = i;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    const option = document.createElement('option');
                    option.value = serviceName;
                    option.text = serviceName;
                    serviceSelect.appendChild(option);
                    serviceSelect.value = serviceName;
                }
            }
            modal.style.display = 'none';
            const orderSection = document.getElementById('order');
            if (orderSection) {
                orderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            showNotification(`Вы выбрали: ${serviceName}`, 'success');
        });
    });
}

// ========== ОТПРАВКА ФОРМЫ (ИСПРАВЛЕНА) ==========
function initFormSubmit() {
    const form = document.getElementById('orderForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name')?.value.trim();
            const contact = document.getElementById('contact')?.value.trim();
            const service = document.getElementById('service')?.value;
            const message = document.getElementById('message')?.value;
            
            if (!name || !contact) {
                showNotification('Пожалуйста, заполните имя и контактные данные', 'error');
                return;
            }
            
            const formData = {
                id: Date.now(),
                name: name,
                contact: contact,
                service: service,
                message: message || 'не указано',
                date: new Date().toLocaleString('ru-RU')
            };
            
            // Безопасное сохранение
            let submissions = safeGetSubmissions();
            submissions.push(formData);
            safeSetSubmissions(submissions);
            
            console.log('✅ Заявка сохранена:', formData);
            
            showNotification('Заявка отправлена! Мы свяжемся с вами.', 'success');
            form.reset();
            updateAdminStats();
        });
    }
}

// ========== АДМИНКА (ИСПРАВЛЕНА) ==========
const ADMIN_CREDENTIALS = {
    login: 'admin',
    password: 'samrau2026'
};

function checkAdminLogin() {
    const login = document.getElementById('adminLogin')?.value;
    const password = document.getElementById('adminPassword')?.value;
    
    if (login === ADMIN_CREDENTIALS.login && password === ADMIN_CREDENTIALS.password) {
        const loginForm = document.getElementById('adminLoginForm');
        const panel = document.getElementById('adminPanel');
        if (loginForm) loginForm.style.display = 'none';
        if (panel) panel.style.display = 'block';
        updateAdminStats();
        showNotification('Вход выполнен', 'success');
    } else {
        showNotification('Неверный логин или пароль', 'error');
    }
}

function updateAdminStats() {
    // Безопасное чтение
    const submissions = safeGetSubmissions();
    
    const statsDiv = document.getElementById('adminStats');
    const listDiv = document.getElementById('adminSubmissionsList');
    
    if (statsDiv) {
        const uniqueContacts = new Set(submissions.map(s => s.contact)).size;
        statsDiv.innerHTML = `
            <p><strong>📊 Всего заявок:</strong> ${submissions.length}</p>
            <p><strong>👥 Уникальных клиентов:</strong> ${uniqueContacts}</p>
            <p><strong>📅 Последняя заявка:</strong> ${submissions[submissions.length-1]?.date || 'нет'}</p>
        `;
    }
    
    if (listDiv) {
        if (submissions.length === 0) {
            listDiv.innerHTML = '<p>Пока нет заявок</p>';
        } else {
            listDiv.innerHTML = '';
            [...submissions].reverse().forEach(sub => {
                const item = document.createElement('div');
                item.className = 'submission-item';
                item.innerHTML = `
                    <p><strong>📝 Заявка #${sub.id}</strong> | ${sub.date}</p>
                    <p><strong>👤 Имя:</strong> ${escapeHtml(sub.name)}</p>
                    <p><strong>📞 Контакт:</strong> ${escapeHtml(sub.contact)}</p>
                    <p><strong>📦 Услуга:</strong> ${escapeHtml(sub.service)}</p>
                    <p><strong>💬 Сообщение:</strong> ${escapeHtml(sub.message)}</p>
                `;
                listDiv.appendChild(item);
            });
        }
    }
}

function logoutAdmin() {
    const loginForm = document.getElementById('adminLoginForm');
    const panel = document.getElementById('adminPanel');
    const loginInput = document.getElementById('adminLogin');
    const passwordInput = document.getElementById('adminPassword');
    
    if (loginForm) loginForm.style.display = 'block';
    if (panel) panel.style.display = 'none';
    if (loginInput) loginInput.value = '';
    if (passwordInput) passwordInput.value = '';
    showNotification('Вы вышли из админ-панели', 'info');
}

// ========== УВЕДОМЛЕНИЯ ==========
function showNotification(message, type = 'info') {
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
    notification.innerHTML = `<i class="fas ${icon}"></i><span>${escapeHtml(message)}</span>`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }, 10);
}

// ========== FAQ ==========
function initFaq() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                faqItems.forEach(i => i.classList.remove('active'));
                if (!isActive) item.classList.add('active');
            });
        }
    });
}

// ========== СЛАЙДЕР ==========
function initSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevArrow = document.querySelector('.prev-arrow');
    const nextArrow = document.querySelector('.next-arrow');
    let currentSlide = 0;
    
    if (!slides.length) return;
    
    function showSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active-dot'));
        slides[index].classList.add('active');
        dots[index].classList.add('active-dot');
        currentSlide = index;
    }
    
    if (prevArrow) prevArrow.addEventListener('click', () => showSlide(currentSlide - 1));
    if (nextArrow) nextArrow.addEventListener('click', () => showSlide(currentSlide + 1));
    dots.forEach((dot, index) => dot.addEventListener('click', () => showSlide(index)));
    
    setInterval(() => showSlide(currentSlide + 1), 5000);
}

// ========== ПОИСК В ШАПКЕ ==========
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchInput) {
        searchInput.value = '';
    }
    
    function performSearch() {
        const query = searchInput.value.trim();
        if (query.length > 0) {
            showSearchModal(query);
        } else {
            showNotification('Введите текст для поиска', 'info');
        }
    }
    
    if (searchBtn) searchBtn.addEventListener('click', performSearch);
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }
}

// ========== ЗАКРЫТИЕ МОДАЛЬНЫХ ОКОН ==========
function initModals() {
    const closeBtns = document.querySelectorAll('.modal-close');
    const modals = document.querySelectorAll('.modal');
    
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modals.forEach(modal => modal.style.display = 'none');
        });
    });
    
    window.addEventListener('click', (e) => {
        modals.forEach(modal => {
            if (e.target === modal) modal.style.display = 'none';
        });
    });
}

// ========== АДМИНКА В ШАПКЕ ==========
function initAdminLink() {
    const adminLink = document.getElementById('adminLink');
    const adminModal = document.getElementById('adminModal');
    
    if (adminLink) {
        adminLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (adminModal) adminModal.style.display = 'flex';
        });
    }
}

// ========== ПЛАВНАЯ ПРОКРУТКА ==========
function initSmoothScroll() {
    const contactLink = document.getElementById('contactLink');
    if (contactLink) {
        contactLink.addEventListener('click', (e) => {
            e.preventDefault();
            const contactSection = document.getElementById('contact');
            if (contactSection) {
                contactSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        if (anchor.id === 'contactLink') return;
        if (anchor.id === 'adminLink') return;
        
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            if (targetId === '#admin') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Сайт загружается...');
    
    // Инициализация всех функций
    loadCatalog();
    initSlider();
    initFaq();
    initFormSubmit();
    initSearch();
    initModals();
    initAdminLink();
    initSmoothScroll();
    
    // Проверка и очистка битых данных при загрузке
    const testData = safeGetSubmissions();
    if (testData.length === 0) {
        safeSetSubmissions([]);
    }
    console.log('✅ Сайт готов к работе');
});
