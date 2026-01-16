// Класс PasswordManager позволит инкапсулировать всю логику приложения
// Приложение запускается автоматически при загрузке DOM
class PasswordManager {
    constructor() {
        this.passwords = []; // Массив сохранённых паролей
        this.currentPassword = ''; // Текущий сгенерированный пароль
        this.currentIndex = -1;  // Индекс текущего редактируемого пароля
        this.deleteTimerId = null;  // ID таймера удаления (для отмены)
        this.init(); // Инициализация приложения
    }

    // Инициализация приложения
    init() {
        this.loadPasswords(); // загрузка данных,
        this.setupEventListeners(); // подписка на события
        this.updatePasswordsList(); // обновление списка паролей
    }

    // Загружает пароли из localStorage, если они сохранены
    loadPasswords() {
        const stored = localStorage.getItem('passwords');
        this.passwords = stored ? JSON.parse(stored) : [];
    }

    // Сохраняет пароли в localStorage
    savePasswords() {
        localStorage.setItem('passwords', JSON.stringify(this.passwords));
        this.updatePasswordsList();
    }

    // Генерирует пароль на основе выбранных параметров пользователя
    generatePassword() {
        // Считываем опции генерации
        const options = {
            uppercase: document.getElementById('uppercase').checked,
            lowercase: document.getElementById('lowercase').checked,
            numbers: document.getElementById('numbers').checked,
            symbols: document.getElementById('symbols').checked
        };

        const length = parseInt(document.getElementById('lengthSlider').value);
        // Формируем набор допустимых символов
        let chars = '';
        if (options.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (options.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (options.numbers) chars += '0123456789';
        if (options.symbols) chars += '!@#$%^&*()-_=+[]{}|;:,.<>?';

        if (!chars) {
            alert('Выберите хотя бы один тип символов!');
            return '';
        }

        // Генерация случайного пароля указанной длины
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Сохраняем результат и обновляем поле вывода
        this.currentPassword = password;
        document.getElementById('passwordOutput').value = password;
        return password;
    }

    // Обновляет числовое отображение длины пароля при движении ползунка
    updateLengthDisplay() {
        const length = document.getElementById('lengthSlider').value;
        document.getElementById('lengthValue').value = length;
    }

    // Копирует текст в буфер обмена и показывает уведомление
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Скопировано в буфер обмена!');
        });
    }

    // Показывает временное уведомление (toast)
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: -100px;
            left: 50%;
            margin-left: -80px;
            background: #4caf50;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 2000;
            animation: slideInDown 0.3s ease-out forwards;
            width: 160px;
            text-align: center;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Уведомление исчезает плавно через 2 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOutUp 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // Открывает модальное окно по ID
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Закрывает модальное окно по ID
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        // Восстанавливаем прокрутку, если нет других открытых окон
        if (!document.querySelector('.modal.active')) {
            document.body.style.overflow = 'auto';
        }
    }

    // Переключение между экранами (генератор / список)
    switchScreen(fromScreenId, toScreenId) {
        document.getElementById(fromScreenId).classList.remove('active');
        document.getElementById(toScreenId).classList.add('active');
    }

    // Обновляет список сохранённых паролей на экране
    updatePasswordsList() {
        const list = document.getElementById('passwordsList');
        const emptyMsg = document.getElementById('emptyMessage');

        if (this.passwords.length === 0) {
            list.innerHTML = '';
            emptyMsg.style.display = 'block';
            return;
        }

        emptyMsg.style.display = 'none';
        // Генерируем HTML-карточки для каждого пароля (Решил тут реализовать для удобства)
        list.innerHTML = this.passwords.map((pwd, index) => `
            <div class="password-item" onclick="app.openPasswordView(${index})">
                <div class="password-item-content">
                    <div class="password-item-number">#${index + 1}</div>
                    <div class="password-item-login">${this.escapeHtml(pwd.login)}</div>
                    ${pwd.url ? `<div class="password-item-url">${this.escapeHtml(pwd.url)}</div>` : ''}
                </div>
                <div class="password-item-actions">
                    <button class="action-btn" onclick="event.stopPropagation(); app.openEditModal(${index})" title="Редактировать" >
                        <svg viewBox="0 0 24 24" width="20" height="20">
                             <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 
           7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 
           1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Экранирует HTML-символы для защиты от XSS
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Открывает окно просмотра пароля
    openPasswordView(index) {
        const pwd = this.passwords[index];
        document.getElementById('viewLogin').textContent = pwd.login;
        document.getElementById('viewPassword').textContent = pwd.password;
        document.getElementById('viewUrl').textContent = pwd.url || 'Не указан';
        this.openModal('viewModal');
    }

    // Открывает окно редактирования пароля
    openEditModal(index) {
        this.currentIndex = index;
        const pwd = this.passwords[index];
        document.getElementById('editLoginInput').value = pwd.login;
        document.getElementById('editPasswordInput').value = pwd.password;
        document.getElementById('editUrlInput').value = pwd.url || '';
        this.openModal('editModal');
    }

    // Открывает окно удаления с трёхсекундным таймером подтверждения
    openDeleteModal(index) {
        this.currentIndex = index;
        const pwd = this.passwords[index];
        document.getElementById('deleteItemName').textContent = pwd.login;
        
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        confirmBtn.disabled = true;
        
        let timeLeft = 3;
        document.getElementById('deleteTimer').textContent = timeLeft;
        
        if (this.deleteTimerId) clearInterval(this.deleteTimerId);
        
        this.deleteTimerId = setInterval(() => {
            timeLeft--;
            document.getElementById('deleteTimer').textContent = timeLeft;
            
            if (timeLeft === 0) {
                confirmBtn.disabled = false;
                clearInterval(this.deleteTimerId);
            }
        }, 1000);
        
        this.openModal('deleteModal');
    }

    // Настраивает все обработчики событий приложения
    setupEventListeners() {
        // Навигация между экранами
        document.getElementById('toListBtn').addEventListener('click', () => {
            this.switchScreen('generatorScreen', 'listScreen');
        });

        document.getElementById('toGeneratorBtn').addEventListener('click', () => {
            this.switchScreen('listScreen', 'generatorScreen');
        });

        // Генерация пароля
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generatePassword();
        });

        // Изменение длины пароля
        document.getElementById('lengthSlider').addEventListener('input', (e) => {
            this.updateLengthDisplay();
        });

        // 'Прямое' изменение числа длины
        document.getElementById('lengthValue').addEventListener('change', (e) => {
            let value = parseInt(e.target.value);
            if (isNaN(value)) value = 16;
            if (value < 4) value = 4;
            if (value > 64) value = 64;
            document.getElementById('lengthSlider').value = value;
            document.getElementById('lengthValue').value = value;
        });

        // Кнопки + и - для длины
        document.getElementById('minusBtn').addEventListener('click', () => {
            const slider = document.getElementById('lengthSlider');
            slider.value = Math.max(parseInt(slider.value) - 1, 4);
            this.updateLengthDisplay();
        });

        document.getElementById('plusBtn').addEventListener('click', () => {
            const slider = document.getElementById('lengthSlider');
            slider.value = Math.min(parseInt(slider.value) + 1, 64);
            this.updateLengthDisplay();
        });

        // Копирование текущего пароля
        document.getElementById('copyBtn').addEventListener('click', () => {
            if (this.currentPassword) {
                this.copyToClipboard(this.currentPassword);
            }
        });

        // Сохранение нового пароля (через модальное окно)
        document.getElementById('saveBtn').addEventListener('click', () => {
            if (!this.currentPassword) {
                alert('Сначала генерируйте пароль!');
                return;
            }
            document.getElementById('loginInput').value = '';
            document.getElementById('urlInput').value = '';
            this.openModal('saveModal');
        });

        // Подтверждение сохранения
        document.getElementById('savePwdBtn').addEventListener('click', () => {
            const login = document.getElementById('loginInput').value.trim();
            const url = document.getElementById('urlInput').value.trim();

            if (!login) {
                alert('Введите название/логин!');
                return;
            }

            this.passwords.push({
                login,
                password: this.currentPassword,
                url
            });

            this.savePasswords();
            this.closeModal('saveModal');
            this.showNotification('Пароль сохранён!');
            this.currentPassword = '';
            document.getElementById('passwordOutput').value = '';
        });

        // Отмена сохранения
        document.getElementById('cancelSaveBtn').addEventListener('click', () => {
            this.closeModal('saveModal');
        });

        // Просмотр пароля
        document.getElementById('viewCopyBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            const password = document.getElementById('viewPassword').textContent;
            this.copyToClipboard(password);
        });

        document.getElementById('viewUrlBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            const url = document.getElementById('viewUrl').textContent;
            if (url && url !== 'Не указан') {
                const fullUrl = url.startsWith('http') ? url : 'https://' + url;
                window.open(fullUrl, '_blank');
            } else {
                this.showNotification('URL не указан!');
            }
        });

        document.getElementById('closeViewBtn').addEventListener('click', () => {
            this.closeModal('viewModal');
        });

        // Изменение пароля
        document.getElementById('updatePwdBtn').addEventListener('click', () => {
            const login = document.getElementById('editLoginInput').value.trim();
            const password = document.getElementById('editPasswordInput').value.trim();
            const url = document.getElementById('editUrlInput').value.trim();

            if (!login) {
                alert('Введите название/логин!');
                return;
            }

            if (!password) {
                alert('Введите пароль!');
                return;
            }

            this.passwords[this.currentIndex] = { login, password, url };
            this.savePasswords();
            this.closeModal('editModal');
            this.showNotification('Пароль обновлён!');
        });

        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            this.closeModal('editModal');
        });

        document.getElementById('deleteEditBtn').addEventListener('click', () => {
            this.closeModal('editModal');
            this.openDeleteModal(this.currentIndex);
        });

        document.getElementById('visitUrlBtn').addEventListener('click', () => {
            const url = document.getElementById('editUrlInput').value.trim();
            if (url) {
                const fullUrl = url.startsWith('http') ? url : 'https://' + url;
                window.open(fullUrl, '_blank');
            } else {
                this.showNotification('URL не указан!');
            }
        });

        // Удаление пароля
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.passwords.splice(this.currentIndex, 1);
            this.savePasswords();
            this.closeModal('deleteModal');
            this.showNotification('Пароль удалён!');
            if (this.deleteTimerId) clearInterval(this.deleteTimerId);
        });

        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            this.closeModal('deleteModal');
            if (this.deleteTimerId) clearInterval(this.deleteTimerId);
        });

        // Закрытие по нажатию на фон
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                    if (this.deleteTimerId) clearInterval(this.deleteTimerId);
                }
            });
        });

        // Обновить отображение длины при загрузке
        this.updateLengthDisplay();
    }
}

// Инициализация приложения после загрузки DOM
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PasswordManager();
});

// Добавляем анимации для уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInDown {
        from {
            opacity: 0;
            top: -100px;
        }
        to {
            opacity: 1;
            top: 20px;
        }
    }
    
    @keyframes slideOutUp {
        from {
            opacity: 1;
            top: 20px;
        }
        to {
            opacity: 0;
            top: -100px;
        }
    }
`;
document.head.appendChild(style);
