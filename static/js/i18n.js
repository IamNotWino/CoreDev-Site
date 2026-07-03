(() => {
    const STORAGE_KEY = 'coredevLanguage';
    const LOCALE_MAP = { ru: 'ru-RU', en: 'en-US', kz: 'kk-KZ' };

    const STRINGS = {
        ru: {
            'meta.title': 'CoreDev | Разработка и IT-решения',
            'nav.home': 'Главная',
            'nav.about': 'О компании',
            'nav.skills': 'Что умеем',
            'nav.projects': 'Проекты',
            'nav.team': 'Команда',
            'nav.apply': 'Заявка',
            'nav.login': 'Вход',
            'nav.register': 'Регистрация',
            'nav.theme.toLight': 'Включить светлую тему',
            'nav.theme.toDark': 'Включить тёмную тему',
            'menu.profile': 'Профиль',
            'menu.settings': 'Настройки',
            'menu.admin': 'Админ панель',
            'menu.logout': 'Выйти',
            'hero.kicker': 'AI-first разработка для бизнеса',
            'hero.title': 'Код, меняющий <span class="hero-highlight">реальность</span><br>CoreDev AI Core',
            'hero.desc': 'Разработка сложных систем, нейросетевые архитектуры, масштабируемая облачная инфраструктура. Создаём технологическое лидерство.',
            'hero.stat.projects': 'проектов',
            'hero.stat.experts': 'экспертов',
            'hero.stat.years': 'на рынке',
            'hero.btn.services': 'Наши услуги',
            'hero.btn.more': 'Узнать больше',
            'about.title': 'О компании CoreDev',
            'about.sub': 'Технологическое сердце вашего бизнеса — от идеи до масштабирования. Глобальная экспертиза, проверенная временем.',
            'about.text': 'CoreDev — это международная IT-компания, основанная в 2016 году экспертами в области высоконагруженных систем, кибербезопасности и искусственного интеллекта... Мы объединяем более 150 инженеров.',
            'about.f1.title': 'Глобальное присутствие',
            'about.f1.desc': 'Офисы и R&D-центры в 8 странах, 24/7 поддержка.',
            'about.f2.title': 'Бизнес-результаты',
            'about.f2.desc': 'Средний ROI наших клиентов за 18 месяцев — 340%.',
            'about.f3.title': 'Безопасность эталонного уровня',
            'about.f3.desc': 'Сертификаты ISO 27001, SOC 2 Type II.',
            'about.f4.title': 'AI-First подход',
            'about.f4.desc': 'Собственная MLOps платформа, генеративные нейросети.',
            'about.btn': 'Подробнее о CoreDev',
            'skills.title': 'Что умеем',
            'skills.sub': 'Мы создаём цифровые продукты любой сложности — от лендингов до высоконагруженных игр и AI-ботов.',
            'projects.title': 'Реализованные проекты',
            'projects.sub': 'Кейсы, которые доказывают наш уровень.',
            'team.title': 'Ключевые сотрудники',
            'team.sub': 'Элита индустрии.',
            'apply.title': 'Подать заявку',
            'apply.sub': 'Заполните форму, и мы свяжемся с вами в течение 24 часов.',
            'apply.form.title': 'Старт вашего проекта',
            'apply.form.sub': 'Расскажите о себе и задачах',
            'form.fullName': 'ФИО',
            'form.company': 'Компания',
            'form.email': 'Email',
            'form.phone': 'Телефон',
            'form.position': 'Направление',
            'form.budget': 'Бюджет',
            'form.message': 'Описание задачи',
            'form.position.placeholder': 'Выберите направление',
            'form.budget.placeholder': 'Сумма',
            'form.submit': 'Отправить заявку',
            'form.section.contact': 'Контактные данные',
            'form.section.project': 'Детали проекта',
            'form.placeholder.fullName': 'Иванов Иван Иванович',
            'form.placeholder.company': 'Название компании',
            'form.placeholder.email': 'you@coredev.ru',
            'form.placeholder.message': 'Опишите задачу, сроки, цели и ожидаемый результат...',
            'form.auth.title': 'Требуется вход',
            'form.auth.text': 'Чтобы отправить заявку, войдите или зарегистрируйтесь.',
            'form.auth.login': 'Войти',
            'form.auth.register': 'Регистрация',
            'form.counter': 'Минимум {min} символов. Сейчас: {current} / {max}',
            'currency.rub': 'Рубли (₽)',
            'currency.usd': 'Доллары ($)',
            'currency.kzt': 'Тенге (₸)',
            'position.dev': 'Разработка ПО',
            'position.ai': 'AI / Машинное обучение',
            'position.web': 'Веб-разработка',
            'position.mobile': 'Мобильные приложения',
            'position.cloud': 'Облачные решения',
            'position.security': 'Кибербезопасность',
            'footer.desc': 'Инженерная команда для сложных цифровых продуктов: веб, AI, облака, безопасность и высоконагруженные системы.',
            'footer.start': 'Запустить проект',
            'footer.cases': 'Кейсы',
            'footer.docs': 'Документация',
            'footer.api': 'API Reference',
            'footer.guides': 'Руководства',
            'footer.sdk': 'SDK и CLI',
            'footer.company': 'Компания',
            'footer.services': 'Услуги',
            'footer.contacts': 'Контакты',
            'footer.legal': 'Правовая информация',
            'footer.privacy': 'Политика конфиденциальности',
            'footer.terms': 'Условия использования',
            'footer.security': 'Безопасность',
            'footer.cookies': 'Cookies',
            'footer.copyright': '© 2025 CoreDev. Все права защищены.',
            'footer.status': 'Статус систем',
            'footer.support': 'Поддержка',
            'login.kicker': 'Безопасный вход',
            'login.title': 'Вход в аккаунт',
            'login.sub': 'Введите данные, чтобы продолжить работу с CoreDev',
            'login.password': 'Пароль',
            'login.password.ph': 'Введите пароль',
            'login.remember': 'Запомнить меня',
            'login.submit': 'Войти',
            'login.forgot': 'Забыли пароль?',
            'forgot.kicker': 'Восстановление доступа',
            'forgot.title': 'Забыли пароль?',
            'forgot.sub': 'Введите email, который указывали при регистрации. Письмо отправится только если аккаунт найден в базе.',
            'forgot.submit': 'Отправить ссылку',
            'forgot.back': 'Вернуться ко входу',
            'forgot.success': 'Мы отправили вам письмо на указанную электронную почту. Если письмо не пришло - проверьте раздел "Спам"',
            'forgot.err': 'Не удалось отправить запрос',
            'reset.kicker': 'Новый пароль',
            'reset.title': 'Сброс пароля',
            'reset.sub': 'Придумайте новый пароль для вашего аккаунта',
            'reset.email': 'Email аккаунта',
            'reset.email.ph': 'Email из ссылки сброса',
            'reset.new': 'Новый пароль',
            'reset.new.ph': 'Введите новый пароль',
            'reset.confirm': 'Подтверждение пароля',
            'reset.confirm.ph': 'Повторите новый пароль',
            'reset.submit': 'Сохранить новый пароль',
            'reset.success': 'Пароль успешно изменён. Теперь можно войти с новым паролем.',
            'reset.success.title': 'Пароль обновлён',
            'reset.success.msg': 'Войдите в аккаунт с новым паролем.',
            'reset.err': 'Не удалось сменить пароль',
            'reset.err.token': 'Ссылка для сброса пароля недействительна или устарела. Запросите новое письмо.',
            'reset.err.used': 'Ссылка уже была использована. Запросите новое письмо.',
            'reset.err.email': 'Не удалось определить email аккаунта. Запросите новое письмо.',
            'reset.checking': 'Проверяем ссылку... Если форма открылась, можно задать новый пароль.',
            'verify.kicker': 'Подтверждение email',
            'verify.title': 'Проверка почты',
            'verify.sub': 'Мы отправили 6-значный код на вашу почту. Аккаунт создастся после подтверждения.',
            'verify.email': 'Email',
            'verify.code': 'Код из письма',
            'verify.code.ph': '000000',
            'verify.submit': 'Подтвердить email',
            'verify.resend': 'Отправить код снова',
            'verify.sent': 'Код отправлен на указанную почту. Проверьте «Входящие» и «Спам».',
            'verify.success.status': 'Email успешно подтверждён',
            'verify.success.title': 'Почта подтверждена',
            'verify.success.msg': 'Аккаунт активирован. Теперь можно пользоваться всеми функциями сайта.',
            'verify.err': 'Не удалось подтвердить email',
            'verify.err.code': 'Введите 6-значный код из письма',
            'verify.resend.success': 'Новый код отправлен на вашу почту',
            'verify.resend.err': 'Не удалось отправить код повторно',
            'register.kicker': 'Быстрый старт',
            'register.title': 'Создать аккаунт',
            'register.sub': 'Присоединяйтесь к сообществу инженеров CoreDev',
            'register.submit': 'Зарегистрироваться',
            'profile.kicker': 'Профиль',
            'profile.title': 'Данные пользователя',
            'profile.sub': 'Измените ник, имя, email или загрузите новую аватарку',
            'profile.avatar': 'Аватар профиля',
            'profile.avatar.desc': 'Загрузите изображение, чтобы аккаунт выглядел персонально.',
            'profile.avatar.upload': 'Загрузить аватарку',
            'profile.avatar.hint': 'PNG, JPG или WebP. Сохраняется локально в браузере.',
            'profile.section': 'Основные данные',
            'profile.nick': 'Ник',
            'profile.fio': 'ФИО',
            'profile.fio.ph': 'ФИО пользователя',
            'profile.save': 'Сохранить',
            'profile.role.admin': 'Админ',
            'captcha.kicker': 'Проверка безопасности',
            'captcha.title': 'Подтвердите отправку',
            'captcha.sub': 'Решите задание ниже, чтобы отправить заявку',
            'captcha.answer.ph': 'Введите ответ',
            'captcha.submit': 'Отправить заявку',
            'captcha.loading': 'Загрузка проверки...',
            'settings.title': 'Настройки',
            'settings.sub': 'Управление безопасностью, уведомлениями и интерфейсом',
            'settings.save': 'Сохранить настройки',
            'common.more': 'Подробнее →',
            'common.case': 'Детали кейса →',
            'toast.notification': 'Уведомление',
            'auth.required.title': 'Требуется вход',
            'auth.required.msg': 'Зарегистрируйтесь и войдите в аккаунт, чтобы отправить заявку.',
            'captcha.block.msg': 'Слишком много неправильных ответов на капчу. Подождите 10 минут',
            'form.check': 'Проверьте поля формы и исправьте ошибки.',
            'form.sending': 'Отправка...',
            'form.success': 'Заявка успешно сохранена! Свяжемся с вами.',
            'toast.sent.title': 'Заявка отправлена',
            'toast.sent.msg': 'Мы сохранили заявку и скоро свяжемся с вами.',
            'logout.title': 'Вы вышли',
            'logout.msg': 'Сессия завершена, кнопки входа снова доступны.',
            'settings.nav.security': 'Безопасность',
            'settings.nav.notifications': 'Уведомления',
            'settings.nav.applications': 'Заявки',
            'settings.nav.interface': 'Интерфейс',
            'settings.nav.privacy': 'Приватность',
            'settings.nav.account': 'Аккаунт',
            'settings.section.security': 'Безопасность',
            'settings.section.notifications': 'Уведомления',
            'settings.section.applications': 'Заявки',
            'settings.section.interface': 'Интерфейс',
            'settings.section.privacy': 'Приватность',
            'settings.section.account': 'Аккаунт',
            'settings.theme.dark': 'Тёмная',
            'settings.theme.light': 'Светлая',
            'settings.theme.system': 'Системная',
            'settings.lang.ru': 'Русский',
            'settings.lang.en': 'English',
            'settings.lang.kz': 'Қазақша',
            'settings.card.sessions': 'Активные сессии',
            'settings.card.sessions.sub': 'Устройства и браузеры, где выполнен вход.',
            'settings.revokeAll': 'Выйти везде',
            'settings.card.loginHistory': 'История входов',
            'settings.card.verification': 'Подтверждение контактов',
            'settings.card.captcha': 'Ограничение капчи',
            'settings.verify.confirmed': 'Подтверждён ({value})',
            'settings.verify.notConfirmed': 'Не подтверждён',
            'settings.captcha.ok': 'Ограничений нет. Капча доступна.',
            'settings.captcha.blocked': 'Аккаунт временно заблокирован из-за капчи. Подождите ~{min} мин.',
            'settings.empty.sessions': 'Активных сессий нет',
            'settings.empty.history': 'История пуста',
            'settings.empty.apps': 'Заявок пока нет',
            'settings.apps.sub': 'История отправленных заявок на проект.',
            'settings.apps.emptyTitle': 'Заявок пока нет',
            'settings.apps.emptyText': 'Отправьте первую заявку через форму на сайте — она появится в этом списке.',
            'settings.apps.goToForm': 'Перейти к форме',
            'settings.draft.sub': 'Незавершённая форма сохраняется автоматически при заполнении.',
            'settings.draft.emptyTitle': 'Черновика нет',
            'settings.draft.emptyText': 'Начните заполнять форму заявки на сайте — черновик появится здесь.',
            'settings.draft.fieldEmpty': 'Не указано',
            'settings.draft.fieldPosition': 'Направление',
            'settings.draft.fieldBudget': 'Бюджет',
            'settings.draft.fieldMessage': 'Описание',
            'settings.draft.missing': 'Черновик не найден',
            'settings.draft.restored': '✅ Черновик восстановлен в форму',
            'settings.draft.restoreBtn': 'Восстановить в форму',
            'settings.draft.deleteBtn': 'Удалить черновик',
            'settings.draft.goToForm': 'Перейти к форме заявки',
            'settings.device': 'Устройство',
            'settings.session.current': 'Текущая',
            'settings.login.success': 'Успех',
            'settings.login.fail': 'Ошибка',
            'settings.app.default': 'Заявка',
            'settings.app.budgetUnknown': 'бюджет не указан',
            'settings.draft.notFound': 'Черновик не найден.',
            'settings.draft.meta': 'Обновлён: {date}. Можно восстановить в форму заявки.',
            'settings.loading': 'Загрузка...',
            'settings.saved': '✅ Настройки сохранены',
            'settings.sessions.revoked': '✅ Другие сессии завершены',
            'settings.draft.deleted': '✅ Черновик удалён',
            'settings.app.accepted': 'Принята',
            'settings.app.inProgress': 'В работе',
            'settings.app.completed': 'Завершена',
            'settings.app.viewDetails': 'Посмотреть заявку',
            'settings.app.detailKicker': 'Отправленная заявка',
            'settings.app.detailMeta': '{date} · {budget}',
            'settings.notify.email': 'Email-уведомления',
            'settings.notify.emailSub': 'Выберите, о чём сообщать на почту.',
            'settings.notify.reply': 'Ответ на заявку',
            'settings.notify.replyDesc': 'Когда менеджер ответил на вашу заявку',
            'settings.notify.status': 'Статус проекта',
            'settings.notify.statusDesc': 'Изменения статуса вашего проекта',
            'settings.notify.news': 'Новости CoreDev',
            'settings.notify.newsDesc': 'Новости, обновления и анонсы CoreDev',
            'settings.notify.push': 'Push / Toast',
            'settings.notify.pushSub': 'Всплывающие уведомления прямо на сайте.',
            'settings.notify.pushSite': 'Показывать уведомления на сайте',
            'settings.notify.pushDesc': 'Короткие подсказки в углу экрана при важных событиях',
            'settings.notify.freq': 'Частота рассылки',
            'settings.notify.freqSub': 'Как часто отправлять письма на email.',
            'settings.freq.immediate': 'Сразу',
            'settings.freq.immediateHint': 'Без задержки',
            'settings.freq.daily': 'Раз в день',
            'settings.freq.dailyHint': 'Одним дайджестом',
            'settings.freq.important': 'Только важное',
            'settings.freq.importantHint': 'Только критичные события',
            'settings.card.myApps': 'Мои заявки',
            'settings.card.draft': 'Черновик заявки',
            'settings.draft.restore': 'Восстановить',
            'settings.draft.delete': 'Удалить',
            'settings.card.theme': 'Тема',
            'settings.card.language': 'Язык',
            'settings.card.timezone': 'Часовой пояс',
            'settings.card.visibility': 'Видимость профиля',
            'settings.visibility.public': 'Показывать ник и email',
            'settings.visibility.hidden': 'Скрыть от других',
            'settings.visibility.sub': 'Для будущего чата и команды.',
            'settings.card.account': 'Управление аккаунтом',
            'settings.account.sub': 'Безопасность входа и критичные действия с аккаунтом.',
            'settings.account.passwordHint': 'Обновите пароль для защиты входа',
            'settings.account.deleteHint': 'Безвозвратное удаление профиля и всех данных',
            'settings.changePassword': 'Изменить пароль',
            'settings.deleteAccount': 'Удалить аккаунт',
            'register.username': 'Имя пользователя',
            'register.password': 'Пароль',
            'register.confirmPassword': 'Подтверждение пароля',
            'register.agree': 'Я принимаю',
            'register.policy': 'политику конфиденциальности',
            'register.terms': 'условия использования',
            'register.agree.and': 'и',
            'form.err.fio': 'Некорректное ФИО',
            'form.err.company': 'Некорректное название компании',
            'form.err.email': 'Некорректный email',
            'form.err.phone': 'Введите корректный номер: ровно 11 цифр',
            'form.err.position': 'Выберите направление',
            'form.err.budget': 'Введите сумму только цифрами и выберите валюту',
            'form.err.message': 'Описание должно содержать от {min} до {max} символов',
            'form.err.captcha.load': 'Не удалось загрузить проверку',
            'form.err.captcha.notloaded': 'Проверка не загружена. Обновите задание.',
            'form.err.captcha.answer': 'Введите ответ',
            'form.err.captcha.wrong': 'Неверный ответ',
            'form.err.save': 'Ошибка сохранения заявки',
            'form.sending.request': 'Отправка заявки...',
            'captcha.security.title': 'Проверка безопасности',
            'captcha.wait.min': 'Подождите {min} мин',
            'captcha.wait.sec': 'Подождите {sec} сек',
            'aria.closeToast': 'Закрыть уведомление',
            'aria.openMenu': 'Открыть меню',
            'aria.closeMenu': 'Закрыть меню',
            'aria.showPassword': 'Показать пароль',
            'aria.hidePassword': 'Скрыть пароль',
            'user.default': 'Пользователь',
            'avatar.alt': 'Аватар пользователя',
            'login.err': 'Не удалось войти',
            'login.err.title': 'Ошибка входа',
            'login.err.password': 'Введите пароль',
            'login.success.status': 'Успешный вход! Сессия активна {days} {daysLabel}.',
            'login.success.title': 'Вход выполнен',
            'login.success.msg': 'Сессия активна {days} {daysLabel}.',
            'login.day.one': 'день',
            'login.day.many': 'дней',
            'admin.btn': 'Админ панель',
            'admin.btn.short': 'Админ',
            'admin.title': 'Админ панель',
            'admin.sub': 'Управление пользователями и мониторинг системы',
            'admin.section.users': 'Пользователи',
            'admin.section.logs': 'Логи',
            'admin.users.sub': 'Все зарегистрированные аккаунты из базы данных.',
            'admin.users.count': 'В базе: {count} пользователей',
            'admin.logs.sub': 'События на сайте. Время показано в вашем часовом поясе.',
            'admin.logs.empty': 'Событий пока нет',
            'admin.logs.tz': 'Екатеринбург',
            'admin.loading': 'Загрузка...',
            'admin.err.load': 'Не удалось загрузить панель',
            'admin.err.users': 'Не удалось загрузить пользователей',
            'admin.err.logs': 'Не удалось загрузить логи',
            'admin.err.role': 'Не удалось обновить роль',
            'admin.stat.users': 'Пользователей',
            'admin.stat.admins': 'Администраторов',
            'admin.stat.verified': 'Подтверждённых email',
            'admin.stat.applications': 'Заявок',
            'admin.stat.sessions': 'Активных сессий',
            'admin.stat.failed': 'Неудачных входов (24ч)',
            'admin.role.admin': 'Админ',
            'admin.role.member': 'Участник',
            'admin.verified.yes': 'Да',
            'admin.verified.no': 'Нет',
            'admin.action.promote': 'Сделать админом',
            'admin.action.demote': 'Снять админа',
            'admin.self': 'Это вы',
            'admin.manage.open': 'Управление пользователем',
            'admin.manage.user': 'Пользователь',
            'admin.manage.kicker': 'Управление аккаунтом',
            'admin.manage.section.profile': 'Данные профиля',
            'admin.manage.section.danger': 'Опасная зона',
            'admin.manage.hint.email': 'Email для входа и уведомлений',
            'admin.manage.hint.full_name': 'Полное имя в профиле',
            'admin.manage.hint.username': 'Отображаемое имя пользователя',
            'admin.manage.hint.role': 'Участник или администратор',
            'admin.manage.hint.phone': 'Контактный номер аккаунта',
            'admin.manage.hint.delete': 'Безвозвратное удаление из базы',
            'admin.manage.delete': 'Удалить аккаунт',
            'admin.edit.email': 'Изменить почту',
            'admin.edit.fullName': 'Изменить ФИО',
            'admin.edit.username': 'Изменить ник',
            'admin.edit.role': 'Изменить роль',
            'admin.edit.phone': 'Изменить номер телефона',
            'admin.edit.save': 'Сохранить',
            'admin.edit.saved': 'Изменения сохранены',
            'admin.err.update': 'Не удалось обновить пользователя',
            'admin.err.delete': 'Не удалось удалить аккаунт',
            'admin.delete.confirm': 'Удалить аккаунт {email}? Это действие необратимо.',
            'admin.delete.submit': 'Удалить',
            'admin.delete.cancel': 'Отмена',
            'admin.delete.done': 'Аккаунт удалён',
            'admin.err.deleteSelf': 'Нельзя удалить свой аккаунт через админ-панель',
            'admin.users.empty': 'Пользователи не найдены',
            'admin.saving': 'Сохранение...',
            'admin.role.updated': 'Роль обновлена',
            'admin.table.email': 'Email',
            'admin.table.fullName': 'ФИО',
            'admin.table.username': 'Ник',
            'admin.table.role': 'Роль',
            'admin.table.verified': 'Почта',
            'profile.loading': 'Загрузка профиля...',
            'profile.err.load': 'Не удалось загрузить профиль',
            'profile.err.image': 'Выберите изображение.',
            'profile.err.required': 'Ник и email обязательны.',
            'profile.saved.status': 'Данные профиля сохранены.',
            'profile.saved.title': 'Профиль сохранён',
            'profile.saved.msg': 'Данные профиля обновлены.',
            'delete.title': 'Удалить аккаунт?',
            'delete.text': 'Вы действительно хотите удалить свой аккаунт безвозвратно? После удаления аккаунта даже администраторы не смогут его восстановить.',
            'delete.confirmPassword': 'Подтвердите пароль',
            'delete.confirmPassword.ph': 'Введите пароль для подтверждения',
            'delete.yes': 'Да',
            'delete.no': 'Нет',
            'delete.err.login': 'Сначала войдите в аккаунт.',
            'delete.err.password': 'Введите пароль для подтверждения.',
            'delete.loading': 'Удаление аккаунта...',
            'delete.err.failed': 'Не удалось удалить аккаунт',
            'delete.success.title': 'Аккаунт удалён',
            'delete.success.msg': 'Аккаунт удалён безвозвратно.',
            'password.change.kicker': 'Безопасность',
            'password.change.title': 'Изменить пароль',
            'password.change.sub': 'Введите старый пароль, новый пароль и подтверждение',
            'password.old': 'Старый пароль',
            'password.old.ph': 'Введите старый пароль',
            'password.new': 'Новый пароль',
            'password.new.ph': 'Введите новый пароль',
            'password.confirm': 'Подтверждение пароля',
            'password.confirm.ph': 'Повторите новый пароль',
            'password.save': 'Сохранить пароль',
            'password.err.login': 'Сначала войдите в аккаунт.',
            'password.err.old': 'Введите старый пароль',
            'password.changed': 'Пароль изменён.',
            'password.err.failed': 'Не удалось изменить пароль',
            'password.mismatch': 'Пароли не совпадают',
            'password.confirmRequired': 'Повторите пароль',
            'pwd.required': 'Пароль обязателен',
            'pwd.noSpaces': 'Пароль не должен содержать пробелы',
            'pwd.min': 'Пароль должен содержать минимум 8 символов',
            'pwd.max': 'Пароль не должен превышать 20 символов',
            'pwd.upper': 'Пароль должен содержать хотя бы одну заглавную букву (A-Z)',
            'pwd.lower': 'Пароль должен содержать хотя бы одну строчную букву (a-z)',
            'pwd.digit': 'Пароль должен содержать хотя бы одну цифру (0-9)',
            'pwd.special': 'У вас в пароле нету спец знака (например ! @ # $ % ^ & * ( ) - _ = + [ ] { } ; : , . ? / ` ~)',
            'pwd.repeat': 'Пароль не должен содержать три и более одинаковых символа подряд (например 111 или aaa)',
            'pwd.sameUsername': 'Пароль не должен совпадать с именем пользователя',
            'pwd.sameEmail': 'Пароль не должен совпадать с email или его частью',
            'reg.err.username': 'Имя пользователя можно ввести от 5 до 10 символов',
            'reg.err.policy': 'Необходимо принять условия политики конфиденциальности.',
            'reg.loading': 'Регистрация...',
            'reg.success.status': 'Регистрация успешна! Профиль активирован.',
            'reg.success.pending': 'Код отправлен на почту. Аккаунт будет создан только после подтверждения email.',
            'reg.success.title': 'Регистрация успешна',
            'reg.success.msg': 'Профиль активирован, вы вошли в аккаунт.',
            'reg.err.failed': 'Не удалось зарегистрироваться',
            'reg.err.emailTaken': 'Этот email уже зарегистрирован. Войдите в аккаунт. Письмо с кодом не отправляется.',
            'reg.err.usernameTaken': 'Этот ник уже занят. Выберите другой.',
            'reg.err.fullNameTaken': 'Пользователь с таким ФИО уже зарегистрирован.',
            'register.ph.fio': 'Иванов Иван Иванович',
            'register.ph.password': 'Минимум 8 символов',
            'register.ph.confirm': 'Повторите пароль',
            'policy.title': 'Политика конфиденциальности',
            'policy.msg': 'Мы защищаем ваши данные и не передаём их третьим лицам без согласия.',
            'about.toast.msg': 'Инновации мирового уровня: 120+ успешных кейсов, 150+ экспертов, партнёрства с Microsoft, AWS и Google Cloud.',
            'form.err.load': 'Ошибка загрузки',
            'ip.err': 'Публичный IP не определён',
            'settings.err.load': 'Не удалось загрузить настройки',
            'settings.err.save': 'Не удалось сохранить',
            'settings.err.generic': 'Ошибка',
            'alert.skill.web': '🚀 Веб-решения любой сложности',
            'alert.skill.bots': '🤖 Интегрируем платежи, CRM',
            'alert.skill.mobile': '📱 Нативные и кроссплатформенные приложения',
            'alert.skill.games': '🎮 Игры любой сложности',
            'alert.skill.desktop': '💻 Корпоративный софт и автоматизация',
            'alert.skill.ai': '🧠 AI-интеграции и LLM',
            'alert.skill.cloud': '☁️ Полный цикл DevOps и облака',
            'alert.skill.security': '🔐 Полный цикл безопасности',
            'alert.project.fintech': '🏦 FinTech Hub обрабатывает свыше 2 млн транзакций',
            'alert.project.bots': '🤖 Боты обрабатывают 50k+ диалогов',
            'alert.project.health': '🏥 HealthAI уже используется в 12 клиниках',
            'alert.project.logi': '🚚 LogiCore обрабатывает 1.2 млн заказов в сутки',
            'alert.team.alexey': 'Алексей руководит R&D и архитектурой',
            'alert.team.darya': 'Дарья лидирует направление искусственного интеллекта',
            'alert.team.mark': 'Марк отвечает за облачную архитектуру и DevOps',
            'alert.team.kate': 'Екатерина курирует безопасность и compliance',
            'api.authRequired': 'Требуется авторизация',
            'api.sessionInvalid': 'Сессия недействительна',
            'api.accessDenied': 'Доступ запрещён',
            'api.rateLimit': 'Слишком много запросов. Попробуйте позже.',
            'api.badRequest': 'Некорректный запрос',
            'api.registerFields': 'Заполните все поля регистрации',
            'api.loginFields': 'Введите email и пароль',
            'api.loginInvalid': 'Неверный email или пароль',
            'api.registerFailed': 'Ошибка регистрации',
            'api.loginFailed': 'Ошибка входа',
            'api.profileLoadFailed': 'Не удалось получить профиль',
            'api.profileError': 'Ошибка получения профиля',
            'api.oldPasswordInvalid': 'Старый пароль неверный',
            'api.passwordUpdateFailed': 'Не удалось обновить пароль',
            'api.passwordSaveFailed': 'Не удалось сохранить новый пароль',
            'api.passwordChangeFailed': 'Ошибка смены пароля',
            'api.passwordInvalid': 'Неверный пароль',
            'api.profileDeleteFailed': 'Не удалось удалить профиль',
            'api.accountPartialDelete': 'Профиль удалён, но аккаунт не удалён полностью',
            'api.accountDeleteFailed': 'Ошибка удаления аккаунта',
            'api.captchaCreateFailed': 'Не удалось создать капчу',
            'api.projectFields': 'Заполните все обязательные поля',
            'api.projectSaveFailed': 'Не удалось сохранить заявку',
            'api.projectError': 'Ошибка сохранения заявки',
            'api.invalidPassword': 'Некорректный пароль',
            'api.invalidUsername': 'Некорректное имя пользователя',
            'api.invalidPhone': 'Некорректный телефон',
            'api.invalidBudget': 'Некорректный бюджет',
            'api.invalidCurrency': 'Некорректная валюта',
            'api.invalidField': 'Некорректные данные',
            'api.dbRequest': 'Некорректный запрос к базе данных',
            'api.userCreateFailed': 'Не удалось создать пользователя',
            'api.profileNotSaved': 'Профиль не сохранён',
            'api.emailNotFound': 'Такой электронной почты нет в базе данных',
            'api.adminRequired': 'Требуются права администратора',
            'api.adminSelfDemote': 'Нельзя снять права администратора с самого себя',
            'api.roleUpdated': 'Роль обновлена',
        },
        en: {
            'meta.title': 'CoreDev | Software Development & IT Solutions',
            'nav.home': 'Home',
            'nav.about': 'About',
            'nav.skills': 'Services',
            'nav.projects': 'Projects',
            'nav.team': 'Team',
            'nav.apply': 'Apply',
            'nav.login': 'Sign in',
            'nav.register': 'Sign up',
            'nav.theme.toLight': 'Switch to light theme',
            'nav.theme.toDark': 'Switch to dark theme',
            'menu.profile': 'Profile',
            'menu.settings': 'Settings',
            'menu.admin': 'Admin panel',
            'menu.logout': 'Log out',
            'hero.kicker': 'AI-first development for business',
            'hero.title': 'Code that changes <span class="hero-highlight">reality</span><br>CoreDev AI Core',
            'hero.desc': 'Complex systems, neural architectures, and scalable cloud infrastructure. We build technological leadership.',
            'hero.stat.projects': 'projects',
            'hero.stat.experts': 'experts',
            'hero.stat.years': 'on the market',
            'hero.btn.services': 'Our services',
            'hero.btn.more': 'Learn more',
            'about.title': 'About CoreDev',
            'about.sub': 'The technological heart of your business — from idea to scale. Global expertise proven over time.',
            'about.text': 'CoreDev is an international IT company founded in 2016 by experts in high-load systems, cybersecurity, and artificial intelligence... We unite more than 150 engineers.',
            'about.f1.title': 'Global presence',
            'about.f1.desc': 'Offices and R&D centers in 8 countries, 24/7 support.',
            'about.f2.title': 'Business results',
            'about.f2.desc': 'Average client ROI over 18 months — 340%.',
            'about.f3.title': 'Reference-grade security',
            'about.f3.desc': 'ISO 27001 and SOC 2 Type II certified.',
            'about.f4.title': 'AI-First approach',
            'about.f4.desc': 'Proprietary MLOps platform and generative AI.',
            'about.btn': 'More about CoreDev',
            'skills.title': 'What we do',
            'skills.sub': 'We build digital products of any complexity — from landing pages to high-load games and AI bots.',
            'projects.title': 'Delivered projects',
            'projects.sub': 'Case studies that prove our level.',
            'team.title': 'Key team members',
            'team.sub': 'Industry elite.',
            'apply.title': 'Submit a request',
            'apply.sub': 'Fill out the form and we will contact you within 24 hours.',
            'apply.form.title': 'Start your project',
            'apply.form.sub': 'Tell us about yourself and your goals',
            'form.fullName': 'Full name',
            'form.company': 'Company',
            'form.email': 'Email',
            'form.phone': 'Phone',
            'form.position': 'Direction',
            'form.budget': 'Budget',
            'form.message': 'Task description',
            'form.position.placeholder': 'Select direction',
            'form.budget.placeholder': 'Amount',
            'form.submit': 'Submit request',
            'form.section.contact': 'Contact details',
            'form.section.project': 'Project details',
            'form.placeholder.fullName': 'John Michael Smith',
            'form.placeholder.company': 'Company name',
            'form.placeholder.email': 'you@coredev.ru',
            'form.placeholder.message': 'Describe the task, timeline, goals, and expected outcome...',
            'form.auth.title': 'Sign-in required',
            'form.auth.text': 'Sign in or register to submit a request.',
            'form.auth.login': 'Sign in',
            'form.auth.register': 'Register',
            'form.counter': 'Minimum {min} characters. Current: {current} / {max}',
            'currency.rub': 'Rubles (₽)',
            'currency.usd': 'Dollars ($)',
            'currency.kzt': 'Tenge (₸)',
            'position.dev': 'Software development',
            'position.ai': 'AI / Machine learning',
            'position.web': 'Web development',
            'position.mobile': 'Mobile apps',
            'position.cloud': 'Cloud solutions',
            'position.security': 'Cybersecurity',
            'footer.desc': 'Engineering team for complex digital products: web, AI, cloud, security, and high-load systems.',
            'footer.start': 'Start a project',
            'footer.cases': 'Case studies',
            'footer.docs': 'Documentation',
            'footer.api': 'API Reference',
            'footer.guides': 'Guides',
            'footer.sdk': 'SDK & CLI',
            'footer.company': 'Company',
            'footer.services': 'Services',
            'footer.contacts': 'Contacts',
            'footer.legal': 'Legal',
            'footer.privacy': 'Privacy policy',
            'footer.terms': 'Terms of use',
            'footer.security': 'Security',
            'footer.cookies': 'Cookies',
            'footer.copyright': '© 2025 CoreDev. All rights reserved.',
            'footer.status': 'System status',
            'footer.support': 'Support',
            'login.kicker': 'Secure sign-in',
            'login.title': 'Sign in to your account',
            'login.sub': 'Enter your credentials to continue with CoreDev',
            'login.password': 'Password',
            'login.password.ph': 'Enter password',
            'login.remember': 'Remember me',
            'login.submit': 'Sign in',
            'login.forgot': 'Forgot password?',
            'forgot.kicker': 'Account recovery',
            'forgot.title': 'Forgot password?',
            'forgot.sub': 'Enter the email you used to register. The message is sent only if the account exists in the database.',
            'forgot.submit': 'Send reset link',
            'forgot.back': 'Back to sign in',
            'forgot.success': 'We sent an email to the address you provided. If you do not see it, check your Spam folder.',
            'forgot.err': 'Failed to send reset request',
            'reset.kicker': 'New password',
            'reset.title': 'Reset password',
            'reset.sub': 'Choose a new password for your account',
            'reset.email': 'Account email',
            'reset.email.ph': 'Email from reset link',
            'reset.new': 'New password',
            'reset.new.ph': 'Enter new password',
            'reset.confirm': 'Confirm password',
            'reset.confirm.ph': 'Repeat new password',
            'reset.submit': 'Save new password',
            'reset.success': 'Password changed successfully. You can now sign in with the new password.',
            'reset.success.title': 'Password updated',
            'reset.success.msg': 'Sign in with your new password.',
            'reset.err': 'Failed to reset password',
            'reset.err.token': 'Password reset link is invalid',
            'reset.err.used': 'This reset link was already used. Request a new email.',
            'reset.err.email': 'Could not determine account email. Request a new email.',
            'verify.kicker': 'Email verification',
            'verify.title': 'Verify your email',
            'verify.sub': 'We sent a 6-digit code to your inbox. Your account will be created after confirmation.',
            'verify.email': 'Email',
            'verify.code': 'Code from email',
            'verify.code.ph': '000000',
            'verify.submit': 'Confirm email',
            'verify.resend': 'Resend code',
            'verify.sent': 'A code was sent to your email. Check Inbox and Spam.',
            'verify.success.status': 'Email confirmed successfully',
            'verify.success.title': 'Email verified',
            'verify.success.msg': 'Your account is activated. You can now use all site features.',
            'verify.err': 'Failed to verify email',
            'verify.err.code': 'Enter the 6-digit code from the email',
            'verify.resend.success': 'A new code was sent to your email',
            'verify.resend.err': 'Failed to resend the code',
            'register.kicker': 'Quick start',
            'register.title': 'Create an account',
            'register.sub': 'Join the CoreDev engineering community',
            'register.submit': 'Sign up',
            'profile.kicker': 'Profile',
            'profile.title': 'User details',
            'profile.sub': 'Change username, name, email, or upload a new avatar',
            'profile.avatar': 'Profile avatar',
            'profile.avatar.desc': 'Upload an image to personalize your account.',
            'profile.avatar.upload': 'Upload avatar',
            'profile.avatar.hint': 'PNG, JPG or WebP. Stored locally in the browser.',
            'profile.section': 'Basic information',
            'profile.nick': 'Username',
            'profile.fio': 'Full name',
            'profile.fio.ph': 'User full name',
            'profile.save': 'Save',
            'profile.role.admin': 'Admin',
            'captcha.kicker': 'Security check',
            'captcha.title': 'Confirm submission',
            'captcha.sub': 'Solve the challenge below to submit your request',
            'captcha.answer.ph': 'Enter answer',
            'captcha.submit': 'Submit request',
            'captcha.loading': 'Loading challenge...',
            'settings.title': 'Settings',
            'settings.sub': 'Manage security, notifications, and interface',
            'settings.save': 'Save settings',
            'common.more': 'Learn more →',
            'common.case': 'Case details →',
            'toast.notification': 'Notification',
            'auth.required.title': 'Sign-in required',
            'auth.required.msg': 'Register and sign in to submit a request.',
            'captcha.block.msg': 'Too many incorrect captcha answers. Please wait 10 minutes.',
            'form.check': 'Please check the form and fix the errors.',
            'form.sending': 'Sending...',
            'form.success': 'Request saved successfully! We will contact you.',
            'toast.sent.title': 'Request submitted',
            'toast.sent.msg': 'We saved your request and will contact you soon.',
            'logout.title': 'Signed out',
            'logout.msg': 'Session ended. Sign-in buttons are available again.',
            'settings.nav.security': 'Security',
            'settings.nav.notifications': 'Notifications',
            'settings.nav.applications': 'Applications',
            'settings.nav.interface': 'Interface',
            'settings.nav.privacy': 'Privacy',
            'settings.nav.account': 'Account',
            'settings.section.security': 'Security',
            'settings.section.notifications': 'Notifications',
            'settings.section.applications': 'Applications',
            'settings.section.interface': 'Interface',
            'settings.section.privacy': 'Privacy',
            'settings.section.account': 'Account',
            'settings.theme.dark': 'Dark',
            'settings.theme.light': 'Light',
            'settings.theme.system': 'System',
            'settings.lang.ru': 'Russian',
            'settings.lang.en': 'English',
            'settings.lang.kz': 'Kazakh',
            'settings.card.sessions': 'Active sessions',
            'settings.card.sessions.sub': 'Devices and browsers where you are signed in.',
            'settings.revokeAll': 'Sign out everywhere',
            'settings.card.loginHistory': 'Sign-in history',
            'settings.card.verification': 'Contact verification',
            'settings.card.captcha': 'Captcha restriction',
            'settings.verify.confirmed': 'Verified ({value})',
            'settings.verify.notConfirmed': 'Not verified',
            'settings.captcha.ok': 'No restrictions. Captcha is available.',
            'settings.captcha.blocked': 'Account temporarily blocked due to captcha. Wait ~{min} min.',
            'settings.empty.sessions': 'No active sessions',
            'settings.empty.history': 'History is empty',
            'settings.empty.apps': 'No applications yet',
            'settings.apps.sub': 'History of submitted project requests.',
            'settings.apps.emptyTitle': 'No applications yet',
            'settings.apps.emptyText': 'Submit your first request via the site form — it will appear here.',
            'settings.apps.goToForm': 'Go to form',
            'settings.draft.sub': 'An incomplete form is saved automatically as you type.',
            'settings.draft.emptyTitle': 'No draft',
            'settings.draft.emptyText': 'Start filling out the request form on the site — a draft will appear here.',
            'settings.draft.fieldEmpty': 'Not specified',
            'settings.draft.fieldPosition': 'Direction',
            'settings.draft.fieldBudget': 'Budget',
            'settings.draft.fieldMessage': 'Description',
            'settings.draft.missing': 'Draft not found',
            'settings.draft.restored': '✅ Draft restored to the form',
            'settings.draft.restoreBtn': 'Restore to form',
            'settings.draft.deleteBtn': 'Delete draft',
            'settings.draft.goToForm': 'Go to request form',
            'settings.device': 'Device',
            'settings.session.current': 'Current',
            'settings.login.success': 'Success',
            'settings.login.fail': 'Failed',
            'settings.app.default': 'Application',
            'settings.app.budgetUnknown': 'budget not specified',
            'settings.draft.notFound': 'No draft found.',
            'settings.draft.meta': 'Updated: {date}. You can restore it to the request form.',
            'settings.loading': 'Loading...',
            'settings.saved': '✅ Settings saved',
            'settings.sessions.revoked': '✅ Other sessions ended',
            'settings.draft.deleted': '✅ Draft deleted',
            'settings.app.accepted': 'Accepted',
            'settings.app.inProgress': 'In progress',
            'settings.app.completed': 'Completed',
            'settings.app.viewDetails': 'View application',
            'settings.app.detailKicker': 'Submitted request',
            'settings.app.detailMeta': '{date} · {budget}',
            'settings.notify.email': 'Email notifications',
            'settings.notify.emailSub': 'Choose what we send to your inbox.',
            'settings.notify.reply': 'Application reply',
            'settings.notify.replyDesc': 'When a manager replies to your request',
            'settings.notify.status': 'Project status',
            'settings.notify.statusDesc': 'Updates about your project status',
            'settings.notify.news': 'CoreDev news',
            'settings.notify.newsDesc': 'News, updates, and announcements from CoreDev',
            'settings.notify.push': 'Push / Toast',
            'settings.notify.pushSub': 'Pop-up notifications right on the site.',
            'settings.notify.pushSite': 'Show on-site notifications',
            'settings.notify.pushDesc': 'Short hints in the corner for important events',
            'settings.notify.freq': 'Notification frequency',
            'settings.notify.freqSub': 'How often to send email notifications.',
            'settings.freq.immediate': 'Immediately',
            'settings.freq.immediateHint': 'No delay',
            'settings.freq.daily': 'Once a day',
            'settings.freq.dailyHint': 'One daily digest',
            'settings.freq.important': 'Important only',
            'settings.freq.importantHint': 'Only critical events',
            'settings.card.myApps': 'My applications',
            'settings.card.draft': 'Application draft',
            'settings.draft.restore': 'Restore',
            'settings.draft.delete': 'Delete',
            'settings.card.theme': 'Theme',
            'settings.card.language': 'Language',
            'settings.card.timezone': 'Time zone',
            'settings.card.visibility': 'Profile visibility',
            'settings.visibility.public': 'Show username and email',
            'settings.visibility.hidden': 'Hide from others',
            'settings.visibility.sub': 'For future chat and team features.',
            'settings.card.account': 'Account',
            'settings.changePassword': 'Change password',
            'settings.deleteAccount': 'Delete account',
            'register.username': 'Username',
            'register.password': 'Password',
            'register.confirmPassword': 'Confirm password',
            'register.agree': 'I accept the',
            'register.policy': 'privacy policy',
            'register.terms': 'terms of use',
            'register.agree.and': 'and',
            'form.err.fio': 'Invalid full name',
            'form.err.company': 'Invalid company name',
            'form.err.email': 'Invalid email',
            'form.err.phone': 'Enter a valid number: exactly 11 digits',
            'form.err.position': 'Select a direction',
            'form.err.budget': 'Enter digits only and select a currency',
            'form.err.message': 'Description must be between {min} and {max} characters',
            'form.err.captcha.load': 'Failed to load challenge',
            'form.err.captcha.notloaded': 'Challenge not loaded. Refresh the task.',
            'form.err.captcha.answer': 'Enter an answer',
            'form.err.captcha.wrong': 'Incorrect answer',
            'form.err.save': 'Failed to save request',
            'form.sending.request': 'Sending request...',
            'captcha.security.title': 'Security check',
            'captcha.wait.min': 'Wait {min} min',
            'captcha.wait.sec': 'Wait {sec} sec',
            'aria.closeToast': 'Close notification',
            'aria.openMenu': 'Open menu',
            'aria.closeMenu': 'Close menu',
            'aria.showPassword': 'Show password',
            'aria.hidePassword': 'Hide password',
            'user.default': 'User',
            'avatar.alt': 'User avatar',
            'login.err': 'Sign-in failed',
            'login.err.title': 'Sign-in failed',
            'login.err.password': 'Enter your password',
            'login.success.status': 'Signed in! Session active for {days} {daysLabel}.',
            'login.success.title': 'Signed in',
            'login.success.msg': 'Session active for {days} {daysLabel}.',
            'login.day.one': 'day',
            'login.day.many': 'days',
            'admin.btn': 'Admin panel',
            'admin.btn.short': 'Admin',
            'admin.title': 'Admin panel',
            'admin.sub': 'Manage users and monitor the system',
            'admin.section.users': 'Users',
            'admin.section.logs': 'Logs',
            'admin.users.sub': 'All registered accounts from the database.',
            'admin.users.count': 'In database: {count} users',
            'admin.logs.sub': 'Site events. Time is shown in your time zone.',
            'admin.logs.empty': 'No events yet',
            'admin.logs.tz': 'Yekaterinburg',
            'admin.loading': 'Loading...',
            'admin.err.load': 'Failed to load admin panel',
            'admin.err.users': 'Failed to load users',
            'admin.err.logs': 'Failed to load logs',
            'admin.err.role': 'Failed to update role',
            'admin.stat.users': 'Users',
            'admin.stat.admins': 'Administrators',
            'admin.stat.verified': 'Verified emails',
            'admin.stat.applications': 'Applications',
            'admin.stat.sessions': 'Active sessions',
            'admin.stat.failed': 'Failed logins (24h)',
            'admin.role.admin': 'Admin',
            'admin.role.member': 'Member',
            'admin.verified.yes': 'Yes',
            'admin.verified.no': 'No',
            'admin.action.promote': 'Make admin',
            'admin.action.demote': 'Remove admin',
            'admin.self': 'This is you',
            'admin.manage.open': 'Manage user',
            'admin.manage.user': 'User',
            'admin.manage.kicker': 'Account management',
            'admin.manage.section.profile': 'Profile data',
            'admin.manage.section.danger': 'Danger zone',
            'admin.manage.hint.email': 'Login email and notifications',
            'admin.manage.hint.full_name': 'Full name on profile',
            'admin.manage.hint.username': 'Display username',
            'admin.manage.hint.role': 'Member or administrator',
            'admin.manage.hint.phone': 'Account phone number',
            'admin.manage.hint.delete': 'Permanent removal from database',
            'admin.manage.delete': 'Delete account',
            'admin.edit.email': 'Change email',
            'admin.edit.fullName': 'Change full name',
            'admin.edit.username': 'Change username',
            'admin.edit.role': 'Change role',
            'admin.edit.phone': 'Change phone number',
            'admin.edit.save': 'Save',
            'admin.edit.saved': 'Changes saved',
            'admin.err.update': 'Failed to update user',
            'admin.err.delete': 'Failed to delete account',
            'admin.delete.confirm': 'Delete account {email}? This cannot be undone.',
            'admin.delete.submit': 'Delete',
            'admin.delete.cancel': 'Cancel',
            'admin.delete.done': 'Account deleted',
            'admin.err.deleteSelf': 'You cannot delete your own account from the admin panel',
            'admin.users.empty': 'No users found',
            'admin.saving': 'Saving...',
            'admin.role.updated': 'Role updated',
            'admin.table.email': 'Email',
            'admin.table.fullName': 'Full name',
            'admin.table.username': 'Username',
            'admin.table.role': 'Role',
            'admin.table.verified': 'Email verified',
            'profile.loading': 'Loading profile...',
            'profile.err.load': 'Failed to load profile',
            'profile.err.image': 'Please select an image.',
            'profile.err.required': 'Username and email are required.',
            'profile.saved.status': 'Profile data saved.',
            'profile.saved.title': 'Profile saved',
            'profile.saved.msg': 'Profile data updated.',
            'delete.title': 'Delete account?',
            'delete.text': 'Are you sure you want to permanently delete your account? After deletion, even administrators cannot restore it.',
            'delete.confirmPassword': 'Confirm password',
            'delete.confirmPassword.ph': 'Enter password to confirm',
            'delete.yes': 'Yes',
            'delete.no': 'No',
            'delete.err.login': 'Please sign in first.',
            'delete.err.password': 'Enter your password to confirm.',
            'delete.loading': 'Deleting account...',
            'delete.err.failed': 'Failed to delete account',
            'delete.success.title': 'Account deleted',
            'delete.success.msg': 'Account permanently deleted.',
            'password.change.kicker': 'Security',
            'password.change.title': 'Change password',
            'password.change.sub': 'Enter your old password, new password, and confirmation',
            'password.old': 'Old password',
            'password.old.ph': 'Enter old password',
            'password.new': 'New password',
            'password.new.ph': 'Enter new password',
            'password.confirm': 'Confirm password',
            'password.confirm.ph': 'Repeat new password',
            'password.save': 'Save password',
            'password.err.login': 'Please sign in first.',
            'password.err.old': 'Enter your current password',
            'password.changed': 'Password changed.',
            'password.err.failed': 'Failed to change password',
            'password.mismatch': 'Passwords do not match',
            'password.confirmRequired': 'Repeat password',
            'pwd.required': 'Password is required',
            'pwd.noSpaces': 'Password must not contain spaces',
            'pwd.min': 'Password must be at least 8 characters',
            'pwd.max': 'Password must not exceed 20 characters',
            'pwd.upper': 'Password must contain at least one uppercase letter (A-Z)',
            'pwd.lower': 'Password must contain at least one lowercase letter (a-z)',
            'pwd.digit': 'Password must contain at least one digit (0-9)',
            'pwd.special': 'Password must contain a special character (e.g. ! @ # $ % ^ & * ( ) - _ = + [ ] { } ; : , . ? / ` ~)',
            'pwd.repeat': 'Password must not contain three or more identical characters in a row (e.g. 111 or aaa)',
            'pwd.sameUsername': 'Password must not match the username',
            'pwd.sameEmail': 'Password must not match email or its part',
            'reg.err.username': 'Username must be 5 to 10 characters',
            'reg.err.policy': 'You must accept the privacy policy.',
            'reg.loading': 'Registering...',
            'reg.success.status': 'Registration successful! Profile activated.',
            'reg.success.pending': 'Code sent to your email. The account will be created only after email confirmation.',
            'reg.success.title': 'Registration successful',
            'reg.success.msg': 'Profile activated. You are signed in.',
            'reg.err.failed': 'Registration failed',
            'reg.err.emailTaken': 'This email is already registered. Sign in or reset your password.',
            'reg.err.usernameTaken': 'This username is already taken. Choose another one.',
            'reg.err.fullNameTaken': 'A user with this full name is already registered.',
            'register.ph.fio': 'John Smith Williams',
            'register.ph.password': 'At least 8 characters',
            'register.ph.confirm': 'Repeat password',
            'policy.title': 'Privacy policy',
            'policy.msg': 'We protect your data and do not share it with third parties without consent.',
            'about.toast.msg': 'World-class innovation: 120+ successful cases, 150+ experts, partnerships with Microsoft, AWS, and Google Cloud.',
            'form.err.load': 'Loading error',
            'ip.err': 'Public IP could not be determined',
            'settings.err.load': 'Failed to load settings',
            'settings.err.save': 'Failed to save',
            'settings.err.generic': 'Error',
            'alert.skill.web': '🚀 Web solutions of any complexity',
            'alert.skill.bots': '🤖 We integrate payments and CRM',
            'alert.skill.mobile': '📱 Native and cross-platform apps',
            'alert.skill.games': '🎮 Games of any complexity',
            'alert.skill.desktop': '💻 Enterprise software and automation',
            'alert.skill.ai': '🧠 AI integrations and LLMs',
            'alert.skill.cloud': '☁️ Full DevOps and cloud lifecycle',
            'alert.skill.security': '🔐 Full security lifecycle',
            'alert.project.fintech': '🏦 FinTech Hub processes over 2M transactions',
            'alert.project.bots': '🤖 Bots handle 50k+ conversations',
            'alert.project.health': '🏥 HealthAI is used in 12 clinics',
            'alert.project.logi': '🚚 LogiCore processes 1.2M orders per day',
            'alert.team.alexey': 'Alexey leads R&D and architecture',
            'alert.team.darya': 'Darya leads the AI division',
            'alert.team.mark': 'Mark is responsible for cloud architecture and DevOps',
            'alert.team.kate': 'Kate oversees security and compliance',
            'api.authRequired': 'Authorization required',
            'api.sessionInvalid': 'Session is invalid',
            'api.accessDenied': 'Access denied',
            'api.rateLimit': 'Too many requests. Please try again later.',
            'api.badRequest': 'Invalid request',
            'api.registerFields': 'Fill in all registration fields',
            'api.loginFields': 'Enter email and password',
            'api.loginInvalid': 'Invalid email or password',
            'api.registerFailed': 'Registration error',
            'api.loginFailed': 'Sign-in error',
            'api.profileLoadFailed': 'Failed to load profile',
            'api.profileError': 'Profile loading error',
            'api.oldPasswordInvalid': 'Old password is incorrect',
            'api.passwordUpdateFailed': 'Failed to update password',
            'api.passwordSaveFailed': 'Failed to save new password',
            'api.passwordChangeFailed': 'Password change error',
            'api.passwordInvalid': 'Invalid password',
            'api.profileDeleteFailed': 'Failed to delete profile',
            'api.accountPartialDelete': 'Profile deleted, but account was not fully removed',
            'api.accountDeleteFailed': 'Account deletion error',
            'api.captchaCreateFailed': 'Failed to create captcha',
            'api.projectFields': 'Fill in all required fields',
            'api.projectSaveFailed': 'Failed to save request',
            'api.projectError': 'Request save error',
            'api.invalidPassword': 'Invalid password',
            'api.invalidUsername': 'Invalid username',
            'api.invalidPhone': 'Invalid phone number',
            'api.invalidBudget': 'Invalid budget',
            'api.invalidCurrency': 'Invalid currency',
            'api.invalidField': 'Invalid data',
            'api.dbRequest': 'Invalid database request',
            'api.userCreateFailed': 'Failed to create user',
            'api.profileNotSaved': 'Profile was not saved',
            'api.emailNotFound': 'This email is not in the database',
            'api.adminRequired': 'Administrator privileges required',
            'api.adminSelfDemote': 'You cannot remove admin rights from yourself',
            'api.roleUpdated': 'Role updated',
        },
    };

    const SKILL_CARDS = {
        ru: [
            ['🌐 Веб-сайты', 'Современные веб-приложения на React, Vue, Angular, Node.js, Python, Go.'],
            ['🤖 Боты', 'Умные боты для Telegram, Discord, AI-диалоги, автоматизация.'],
            ['📱 Мобильные приложения', 'Нативные (Kotlin, Swift) и кроссплатформенные (Flutter, React Native).'],
            ['🎮 Игры', 'Unity (C#), Unreal Engine, браузерные HTML5 игры, мультиплеер.'],
            ['💻 Десктоп и корпоративный софт', 'CRM, ERP, автоматизация, Electron, .NET, C++ Qt.'],
            ['🧠 AI / ChatGPT интеграции', 'LLM, распознавание изображений, рекомендательные системы.'],
            ['☁️ Cloud & DevOps', 'Проектирование облачной инфраструктуры, CI/CD, Kubernetes, Terraform.'],
            ['🔒 Кибербезопасность', 'Penetration testing, Zero Trust, compliance, защита критической инфраструктуры.'],
        ],
        en: [
            ['🌐 Websites', 'Modern web apps with React, Vue, Angular, Node.js, Python, Go.'],
            ['🤖 Bots', 'Smart bots for Telegram, Discord, AI dialogs, and automation.'],
            ['📱 Mobile apps', 'Native (Kotlin, Swift) and cross-platform (Flutter, React Native).'],
            ['🎮 Games', 'Unity (C#), Unreal Engine, browser HTML5 games, multiplayer.'],
            ['💻 Desktop & enterprise software', 'CRM, ERP, automation, Electron, .NET, C++ Qt.'],
            ['🧠 AI / ChatGPT integrations', 'LLMs, image recognition, recommendation systems.'],
            ['☁️ Cloud & DevOps', 'Cloud infrastructure design, CI/CD, Kubernetes, Terraform.'],
            ['🔒 Cybersecurity', 'Penetration testing, Zero Trust, compliance, critical infrastructure protection.'],
        ],
    };

    const PROJECT_CARDS = {
        ru: [
            ['FinTech Hub', 'Платформа для инвестиционного банка с ML-аналитикой. Обработка более 100k RPS.'],
            ['NeuroBot Suite', 'Экосистема умных AI-ботов для e-commerce (Telegram, Discord, GPT-4).'],
            ['HealthAI Platform', 'Система диагностики на базе компьютерного зрения и LLM для клиник.'],
            ['LogiCore OS', 'Полноценная операционная система для крупной логистической сети (2000+ машин).'],
        ],
        en: [
            ['FinTech Hub', 'Investment banking platform with ML analytics. Handles 100k+ RPS.'],
            ['NeuroBot Suite', 'Smart AI bot ecosystem for e-commerce (Telegram, Discord, GPT-4).'],
            ['HealthAI Platform', 'Computer vision and LLM diagnostics system for clinics.'],
            ['LogiCore OS', 'Full operations system for a large logistics network (2000+ vehicles).'],
        ],
    };

    const TEAM_BIOS = {
        ru: [
            'Бывший tech lead в Google. Специалист по распределённым системам и высоконагруженной инфраструктуре.',
            'PhD в области машинного обучения. Автор 30+ научных статей по компьютерному зрению и LLM.',
            'AWS Hero. Построил облачную инфраструктуру для нескольких гиперскейлеров.',
            'Эксперт по кибербезопасности. Внедрила ISO 27001 в более чем 15 крупных компаниях.',
        ],
        en: [
            'Former Google tech lead. Specialist in distributed systems and high-load infrastructure.',
            'PhD in machine learning. Author of 30+ papers on computer vision and LLMs.',
            'AWS Hero. Built cloud infrastructure for several hyperscalers.',
            'Cybersecurity expert. Implemented ISO 27001 at 15+ large companies.',
        ],
    };

    const SKILL_ALERT_KEYS = [
        'alert.skill.web', 'alert.skill.bots', 'alert.skill.mobile', 'alert.skill.games',
        'alert.skill.desktop', 'alert.skill.ai', 'alert.skill.cloud', 'alert.skill.security',
    ];
    const PROJECT_ALERT_KEYS = [
        'alert.project.fintech', 'alert.project.bots', 'alert.project.health', 'alert.project.logi',
    ];
    const TEAM_ALERT_KEYS = [
        'alert.team.alexey', 'alert.team.darya', 'alert.team.mark', 'alert.team.kate',
    ];

    const API_ERROR_MAP = {
        'Требуется авторизация': 'api.authRequired',
        'Сессия недействительна': 'api.sessionInvalid',
        'Доступ запрещён': 'api.accessDenied',
        'Слишком много запросов. Попробуйте позже.': 'api.rateLimit',
        'Некорректный запрос': 'api.badRequest',
        'Заполните все поля регистрации': 'api.registerFields',
        'Введите email и пароль': 'api.loginFields',
        'Неверный email или пароль': 'api.loginInvalid',
        'Ошибка регистрации': 'api.registerFailed',
        'Ошибка входа': 'api.loginFailed',
        'Не удалось получить профиль': 'api.profileLoadFailed',
        'Ошибка получения профиля': 'api.profileError',
        'Старый пароль неверный': 'api.oldPasswordInvalid',
        'Не удалось обновить пароль': 'api.passwordUpdateFailed',
        'Не удалось сохранить новый пароль': 'api.passwordSaveFailed',
        'Ошибка смены пароля': 'api.passwordChangeFailed',
        'Неверный пароль': 'api.passwordInvalid',
        'Не удалось удалить профиль': 'api.profileDeleteFailed',
        'Профиль удалён, но аккаунт не удалён полностью': 'api.accountPartialDelete',
        'Ошибка удаления аккаунта': 'api.accountDeleteFailed',
        'Не удалось создать капчу': 'api.captchaCreateFailed',
        'Заполните все обязательные поля': 'api.projectFields',
        'Не удалось сохранить заявку': 'api.projectSaveFailed',
        'Ошибка сохранения заявки': 'api.projectError',
        'Некорректный email': 'form.err.email',
        'Некорректное ФИО': 'form.err.fio',
        'Не удалось сменить пароль': 'reset.err',
        'Ссылка недействительна или устарела': 'reset.err.token',
        'Ссылка уже была использована': 'reset.err.used',
        'Email аккаунта не указан': 'reset.err.email',
        'Email не совпадает со ссылкой сброса пароля': 'reset.err.email',
        'Аккаунт с таким email не найден': 'form.err.emailTaken',
        'Пароли не совпадают': 'password.mismatch',
        'Некорректный пароль': 'api.invalidPassword',
        'Некорректное имя пользователя': 'api.invalidUsername',
        'Некорректный телефон': 'form.err.phone',
        'Некорректный бюджет': 'api.invalidBudget',
        'Некорректная валюта': 'api.invalidCurrency',
        'Некорректный запрос к базе данных': 'api.dbRequest',
        'Не удалось создать пользователя': 'api.userCreateFailed',
        'Такой электронной почты нет в базе данных': 'api.emailNotFound',
        'Введите 6-значный код из письма': 'verify.err.code',
        'Неверный или просроченный код': 'verify.err',
        'Не удалось подтвердить email': 'verify.err',
        'Не удалось отправить код': 'verify.resend.err',
        'Этот email уже зарегистрирован. Войдите или восстановите пароль.': 'reg.err.emailTaken',
        'Этот ник уже занят. Выберите другой.': 'reg.err.usernameTaken',
        'Пользователь с таким ФИО уже зарегистрирован.': 'reg.err.fullNameTaken',
        'Слишком много неправильных ответов на капчу. Подождите 10 минут': 'captcha.block.msg',
        'Не удалось загрузить настройки': 'settings.err.load',
        'Не удалось сохранить настройки': 'settings.err.save',
        'Не удалось сохранить': 'settings.err.save',
        'Ошибка': 'settings.err.generic',
        'Требуются права администратора': 'api.adminRequired',
        'Нельзя снять права администратора с самого себя': 'api.adminSelfDemote',
        'Роль обновлена': 'api.roleUpdated',
        'Почта обновлена': 'admin.edit.saved',
        'ФИО обновлено': 'admin.edit.saved',
        'Ник обновлён': 'admin.edit.saved',
        'Номер телефона обновлён': 'admin.edit.saved',
        'Аккаунт удалён': 'admin.delete.done',
        'Не удалось обновить пользователя': 'admin.err.update',
        'Не удалось удалить аккаунт': 'admin.err.delete',
        'Нельзя удалить свой аккаунт через админ-панель': 'admin.err.deleteSelf',
        'Не удалось загрузить панель администратора': 'admin.err.load',
        'Не удалось загрузить список пользователей': 'admin.err.users',
        'Не удалось загрузить логи': 'admin.err.logs',
        'Не удалось обновить роль': 'admin.err.role',
    };

    function translateApiError(message) {
        if (!message) return message;
        const text = String(message).trim();
        if (API_ERROR_MAP[text]) return t(API_ERROR_MAP[text]);
        if (text.startsWith('Профиль не сохранён:')) {
            return `${t('api.profileNotSaved')}: ${translateApiError(text.split(':').slice(1).join(':').trim())}`;
        }
        if (/^Некорректн(ый|ое|ая)\s/i.test(text)) return t('api.invalidField');
        if (/капч/i.test(text) && /неверн/i.test(text)) return t('form.err.captcha.wrong');
        if (/капч/i.test(text) && /подождите|минут/i.test(text)) return t('captcha.block.msg');
        return text;
    }

    let currentLang = 'ru';
    const UI_LANG = 'ru';

    function getLanguage() {
        return UI_LANG;
    }

    function t(key, params = {}) {
        let value = STRINGS.ru[key] || STRINGS.en[key] || '';
        if (!value) value = String(key);
        Object.entries(params).forEach(([name, val]) => {
            value = value.replaceAll(`{${name}}`, String(val));
        });
        return value;
    }

    function setLinkText(el, text) {
        if (!el) return;
        const icon = el.querySelector('i');
        el.textContent = '';
        if (icon) el.appendChild(icon.cloneNode(true));
        el.appendChild(document.createTextNode(icon ? ` ${text}` : text));
    }

    function setButtonText(el, text) {
        if (!el) return;
        const icon = el.querySelector('i');
        el.textContent = '';
        if (icon) el.appendChild(icon.cloneNode(true));
        if (icon) el.appendChild(document.createTextNode(` ${text}`));
        else el.textContent = text;
    }

    function setLabelText(labelEl, iconClass, text) {
        if (!labelEl) return;
        labelEl.innerHTML = iconClass ? `<i class="${iconClass}"></i> ${text}` : text;
    }

    function applyLanguage(_lang) {
        currentLang = UI_LANG;
        localStorage.setItem(STORAGE_KEY, UI_LANG);
        document.documentElement.lang = 'ru';
        document.title = t('meta.title');

        const navMap = [
            ['#home', 'nav.home'],
            ['#about', 'nav.about'],
            ['#skills', 'nav.skills'],
            ['#projects', 'nav.projects'],
            ['#team', 'nav.team'],
            ['#apply', 'nav.apply'],
        ];
        navMap.forEach(([href, key]) => setLinkText(document.querySelector(`.nav-links a[href="${href}"]`), t(key)));

        setButtonText(document.getElementById('openLoginBtn'), t('nav.login'));
        setButtonText(document.getElementById('openRegisterBtn'), t('nav.register'));
        window.CoreDevSettings?.updateThemeToggle?.();
        setLinkText(document.getElementById('profileMenuProfile'), t('menu.profile'));
        setLinkText(document.getElementById('profileMenuSettings'), t('menu.settings'));
        setLinkText(document.getElementById('profileMenuAdminText'), t('menu.admin'));
        setLinkText(document.getElementById('profileMenuLogout'), t('menu.logout'));

        const hero = document.querySelector('#home');
        if (hero) {
            setLinkText(hero.querySelector('.hero-kicker'), t('hero.kicker'));
            const h1 = hero.querySelector('.hero-content h1');
            if (h1) h1.innerHTML = t('hero.title');
            const p = hero.querySelector('.hero-content p');
            if (p) p.textContent = t('hero.desc');
            const stats = hero.querySelectorAll('.stat-item span');
            const statKeys = ['hero.stat.projects', 'hero.stat.experts', 'hero.stat.years'];
            stats.forEach((el, i) => { if (statKeys[i]) el.textContent = t(statKeys[i]); });
            setButtonText(hero.querySelector('a.btn-primary'), t('hero.btn.services'));
            setLinkText(hero.querySelector('a.btn-outline'), t('hero.btn.more'));
        }

        const about = document.querySelector('#about');
        if (about) {
            about.querySelector('.section-title').textContent = t('about.title');
            about.querySelector('.section-sub').textContent = t('about.sub');
            const paragraph = about.querySelector('p[style]');
            if (paragraph) paragraph.textContent = t('about.text');
            const features = about.querySelectorAll('.about-feature');
            const fKeys = [
                ['about.f1.title', 'about.f1.desc'],
                ['about.f2.title', 'about.f2.desc'],
                ['about.f3.title', 'about.f3.desc'],
                ['about.f4.title', 'about.f4.desc'],
            ];
            features.forEach((card, i) => {
                if (!fKeys[i]) return;
                card.querySelector('h4').textContent = t(fKeys[i][0]);
                card.querySelector('p').textContent = t(fKeys[i][1]);
            });
            setButtonText(about.querySelector('#moreAboutBtn'), t('about.btn'));
        }

        const skills = document.querySelector('#skills');
        if (skills) {
            skills.querySelector('.section-title').textContent = t('skills.title');
            skills.querySelector('.section-sub').textContent = t('skills.sub');
            const cards = skills.querySelectorAll('.skills-grid .card');
            const data = SKILL_CARDS.ru;
            cards.forEach((card, i) => {
                if (!data[i]) return;
                card.querySelector('h3').textContent = data[i][0];
                card.querySelector('p').textContent = data[i][1];
                const btn = card.querySelector('.btn-small');
                if (btn) {
                    btn.textContent = t('common.more');
                    if (SKILL_ALERT_KEYS[i]) btn.onclick = () => alert(t(SKILL_ALERT_KEYS[i]));
                }
            });
        }

        const projects = document.querySelector('#projects');
        if (projects) {
            projects.querySelector('.section-title').textContent = t('projects.title');
            projects.querySelector('.section-sub').textContent = t('projects.sub');
        }

        const team = document.querySelector('#team');
        if (team) {
            team.querySelector('.section-title').textContent = t('team.title');
            team.querySelector('.section-sub').textContent = t('team.sub');
        }

        const apply = document.querySelector('#apply');
        if (apply) {
            apply.querySelector('.section-title').textContent = t('apply.title');
            apply.querySelector('.section-sub').textContent = t('apply.sub');
            const header = apply.querySelector('.form-header');
            if (header) {
                setButtonText(header.querySelector('h3'), t('apply.form.title'));
                header.querySelector('p').textContent = t('apply.form.sub');
            }
            const labels = {
                projectFullName: 'form.fullName',
                projectCompany: 'form.company',
                projectEmail: 'form.email',
                projectPhone: 'form.phone',
                projectPosition: 'form.position',
                projectBudgetAmount: 'form.budget',
                projectMessage: 'form.message',
            };
            Object.entries(labels).forEach(([id, key]) => {
                const label = document.querySelector(`label[for="${id}"]`);
                if (label) label.textContent = t(key);
            });
            const positionSelect = document.getElementById('projectPosition');
            if (positionSelect) {
                const opts = positionSelect.options;
                if (opts[0]) opts[0].textContent = t('form.position.placeholder');
                const posKeys = ['position.dev', 'position.ai', 'position.web', 'position.mobile', 'position.cloud', 'position.security'];
                posKeys.forEach((key, i) => { if (opts[i + 1]) opts[i + 1].textContent = t(key); });
            }
            const budgetInput = document.getElementById('projectBudgetAmount');
            if (budgetInput) budgetInput.placeholder = t('form.budget.placeholder');
            const currency = document.getElementById('projectBudgetCurrency');
            if (currency) {
                const cur = ['currency.rub', 'currency.usd', 'currency.kzt'];
                cur.forEach((key, i) => { if (currency.options[i]) currency.options[i].textContent = t(key); });
            }
            setButtonText(document.getElementById('projectSubmitBtn'), t('form.submit'));
            window.dispatchEvent(new CustomEvent('coredev-i18n-applied'));
        }

        const footer = document.querySelector('footer');
        if (footer) {
            footer.querySelector('.footer-brand p').textContent = t('footer.desc');
            const footerBtns = footer.querySelectorAll('.footer-button');
            if (footerBtns[0]) setLinkText(footerBtns[0], t('footer.start'));
            if (footerBtns[1]) setLinkText(footerBtns[1], t('footer.cases'));
            const cols = footer.querySelectorAll('.footer-col');
            if (cols[1]) {
                cols[1].querySelector('h4').textContent = t('footer.docs');
                const links = cols[1].querySelectorAll('a');
                const keys = ['footer.docs', 'footer.api', 'footer.guides', 'footer.sdk'];
                links.forEach((a, i) => { if (keys[i]) setLinkText(a, t(keys[i])); });
            }
            if (cols[2]) {
                cols[2].querySelector('h4').textContent = t('footer.company');
                const links = cols[2].querySelectorAll('a');
                const keys = ['footer.company', 'nav.team', 'footer.services', 'footer.contacts'];
                links.forEach((a, i) => { if (keys[i]) setLinkText(a, t(keys[i])); });
            }
            if (cols[3]) {
                cols[3].querySelector('h4').textContent = t('footer.legal');
                const links = cols[3].querySelectorAll('a');
                const keys = ['footer.privacy', 'footer.terms', 'footer.security', 'footer.cookies'];
                links.forEach((a, i) => { if (keys[i]) setLinkText(a, t(keys[i])); });
            }
            const copyright = footer.querySelector('.copyright');
            if (copyright) copyright.textContent = t('footer.copyright');
            const legal = footer.querySelectorAll('.footer-legal a');
            if (legal[0]) legal[0].textContent = t('footer.status');
            if (legal[1]) legal[1].textContent = t('footer.support');
        }

        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.querySelector('.login-kicker').innerHTML = `<i class="fas fa-shield-alt"></i> ${t('login.kicker')}`;
            setButtonText(loginModal.querySelector('.modal-header h3'), t('login.title'));
            loginModal.querySelector('.modal-subtitle').textContent = t('login.sub');
            setLabelText(loginModal.querySelectorAll('.form-field label')[0], 'fas fa-envelope', 'Email');
            setLabelText(loginModal.querySelectorAll('.form-field label')[1], 'fas fa-lock', t('login.password'));
            document.getElementById('loginPassword').placeholder = t('login.password.ph');
            const loginRememberText = loginModal.querySelector('#loginRemember')?.closest('.custom-checkbox')?.querySelector('span:not(.checkbox-ui)');
            if (loginRememberText) loginRememberText.textContent = t('login.remember');
            setButtonText(loginModal.querySelector('button[type="submit"]'), t('login.submit'));
            const forgotBtn = document.getElementById('openForgotPasswordBtn');
            if (forgotBtn) forgotBtn.textContent = t('login.forgot');
        }

        const forgotPasswordModal = document.getElementById('forgotPasswordModal');
        if (forgotPasswordModal) {
            forgotPasswordModal.querySelector('.login-kicker').innerHTML = `<i class="fas fa-unlock-alt"></i> ${t('forgot.kicker')}`;
            setButtonText(forgotPasswordModal.querySelector('.modal-header h3'), t('forgot.title'));
            forgotPasswordModal.querySelector('.modal-subtitle').textContent = t('forgot.sub');
            setLabelText(forgotPasswordModal.querySelector('.form-field label'), 'fas fa-envelope', 'Email');
            setButtonText(forgotPasswordModal.querySelector('button[type="submit"]'), t('forgot.submit'));
            setButtonText(document.getElementById('backToLoginFromForgotBtn'), t('forgot.back'));
        }

        const resetPasswordModal = document.getElementById('resetPasswordModal');
        if (resetPasswordModal) {
            resetPasswordModal.querySelector('.login-kicker').innerHTML = `<i class="fas fa-shield-alt"></i> ${t('reset.kicker')}`;
            setButtonText(resetPasswordModal.querySelector('.modal-header h3'), t('reset.title'));
            resetPasswordModal.querySelector('.modal-subtitle').textContent = t('reset.sub');
            const resetLabels = resetPasswordModal.querySelectorAll('.form-field label');
            if (resetLabels[0]) setLabelText(resetLabels[0], 'fas fa-envelope', t('reset.email'));
            if (resetLabels[1]) setLabelText(resetLabels[1], 'fas fa-lock', t('reset.new'));
            if (resetLabels[2]) setLabelText(resetLabels[2], 'fas fa-lock', t('reset.confirm'));
            const resetEmail = document.getElementById('resetPasswordEmail');
            const resetNew = document.getElementById('resetNewPassword');
            const resetConfirm = document.getElementById('resetConfirmPassword');
            if (resetEmail) resetEmail.placeholder = t('reset.email.ph');
            if (resetNew) resetNew.placeholder = t('reset.new.ph');
            if (resetConfirm) resetConfirm.placeholder = t('reset.confirm.ph');
            setButtonText(resetPasswordModal.querySelector('button[type="submit"]'), t('reset.submit'));
        }

        const emailVerifyModal = document.getElementById('emailVerifyModal');
        if (emailVerifyModal) {
            emailVerifyModal.querySelector('.login-kicker').innerHTML = `<i class="fas fa-envelope-open-text"></i> ${t('verify.kicker')}`;
            setButtonText(emailVerifyModal.querySelector('.modal-header h3'), t('verify.title'));
            emailVerifyModal.querySelector('.modal-subtitle').textContent = t('verify.sub');
            const verifyLabels = emailVerifyModal.querySelectorAll('.form-field label');
            if (verifyLabels[0]) setLabelText(verifyLabels[0], 'fas fa-envelope', t('verify.email'));
            if (verifyLabels[1]) setLabelText(verifyLabels[1], 'fas fa-key', t('verify.code'));
            const verifyCode = document.getElementById('emailVerifyCode');
            if (verifyCode) verifyCode.placeholder = t('verify.code.ph');
            setButtonText(document.getElementById('emailVerifySubmitBtn'), t('verify.submit'));
            setButtonText(document.getElementById('resendEmailVerifyBtn'), t('verify.resend'));
        }

        const registerModal = document.getElementById('registerModal');
        if (registerModal) {
            registerModal.querySelector('.register-kicker').innerHTML = `<i class="fas fa-bolt"></i> ${t('register.kicker')}`;
            setButtonText(registerModal.querySelector('.modal-header h3'), t('register.title'));
            registerModal.querySelector('.modal-subtitle').textContent = t('register.sub');
            const regLabels = registerModal.querySelectorAll('.form-field label');
            if (regLabels[0]) setLabelText(regLabels[0], 'fas fa-user', t('form.fullName'));
            if (regLabels[1]) setLabelText(regLabels[1], 'fas fa-user-tag', t('register.username'));
            if (regLabels[2]) setLabelText(regLabels[2], 'fas fa-envelope', 'Email');
            if (regLabels[3]) setLabelText(regLabels[3], 'fas fa-lock', t('register.password'));
            if (regLabels[4]) setLabelText(regLabels[4], 'fas fa-lock', t('register.confirmPassword'));
            const agreeText = registerModal.querySelector('#regAgree')?.closest('.custom-checkbox')?.querySelector('span:not(.checkbox-ui)');
            if (agreeText) {
                agreeText.innerHTML = `${t('register.agree')} <a href="#" id="policyLink">${t('register.policy')}</a> ${t('register.agree.and')} ${t('register.terms')}`;
            }
            setButtonText(document.getElementById('registerSubmitBtn'), t('register.submit'));
            const regFio = document.getElementById('regFullName');
            const regPwd = document.getElementById('regPassword');
            const regConfirm = document.getElementById('regConfirmPassword');
            if (regFio) regFio.placeholder = t('register.ph.fio');
            if (regPwd) regPwd.placeholder = t('register.ph.password');
            if (regConfirm) regConfirm.placeholder = t('register.ph.confirm');
        }

        const changePwdModal = document.getElementById('changePasswordModal');
        if (changePwdModal) {
            changePwdModal.querySelector('.login-kicker').innerHTML = `<i class="fas fa-key"></i> ${t('password.change.kicker')}`;
            setButtonText(changePwdModal.querySelector('.modal-header h3'), t('password.change.title'));
            changePwdModal.querySelector('.modal-subtitle').textContent = t('password.change.sub');
            const cpLabels = changePwdModal.querySelectorAll('.form-field label');
            if (cpLabels[0]) setLabelText(cpLabels[0], 'fas fa-key', t('password.old'));
            if (cpLabels[1]) setLabelText(cpLabels[1], 'fas fa-lock', t('password.new'));
            if (cpLabels[2]) setLabelText(cpLabels[2], 'fas fa-lock', t('password.confirm'));
            const oldPwd = document.getElementById('changeOldPassword');
            const newPwd = document.getElementById('changeNewPassword');
            const confPwd = document.getElementById('changeConfirmPassword');
            if (oldPwd) oldPwd.placeholder = t('password.old.ph');
            if (newPwd) newPwd.placeholder = t('password.new.ph');
            if (confPwd) confPwd.placeholder = t('password.confirm.ph');
            setButtonText(changePwdModal.querySelector('button[type="submit"]'), t('password.save'));
        }

        const deleteModal = document.getElementById('deleteAccountModal');
        if (deleteModal) {
            deleteModal.querySelector('h3').textContent = t('delete.title');
            deleteModal.querySelector('.confirm-delete-text').textContent = t('delete.text');
            const delLabel = deleteModal.querySelector('.confirm-delete-field label');
            if (delLabel) setLabelText(delLabel, 'fas fa-lock', t('delete.confirmPassword'));
            const delPwd = document.getElementById('deleteAccountPassword');
            if (delPwd) delPwd.placeholder = t('delete.confirmPassword.ph');
            setButtonText(document.getElementById('confirmDeleteAccountBtn'), t('delete.yes'));
            setButtonText(document.getElementById('cancelDeleteAccountBtn'), t('delete.no'));
        }

        const profileModal = document.getElementById('profileModal');
        if (profileModal) {
            profileModal.querySelector('.login-kicker').innerHTML = `<i class="fas fa-user-cog"></i> ${t('profile.kicker')}`;
            setButtonText(profileModal.querySelector('.modal-header h3'), t('profile.title'));
            profileModal.querySelector('.modal-subtitle').textContent = t('profile.sub');
            profileModal.querySelector('.profile-editor-title').textContent = t('profile.avatar');
            profileModal.querySelector('.profile-editor-subtitle').textContent = t('profile.avatar.desc');
            profileModal.querySelector('.avatar-upload-label').innerHTML = `<i class="fas fa-camera"></i> ${t('profile.avatar.upload')}`;
            profileModal.querySelector('.profile-editor-hint').textContent = t('profile.avatar.hint');
            profileModal.querySelector('.profile-section-title').innerHTML = `<i class="fas fa-id-card"></i> ${t('profile.section')}`;
            const labels = profileModal.querySelectorAll('.profile-main-card label');
            if (labels[0]) labels[0].innerHTML = `<i class="fas fa-user-tag"></i> ${t('profile.nick')}`;
            if (labels[1]) labels[1].innerHTML = `<i class="fas fa-envelope"></i> Email`;
            if (labels[2]) labels[2].innerHTML = `<i class="fas fa-user"></i> ${t('profile.fio')}`;
            const profileFio = document.getElementById('profileEditFullName');
            if (profileFio) profileFio.placeholder = t('profile.fio.ph');
            setButtonText(profileModal.querySelector('button[type="submit"]'), t('profile.save'));
        }

        const captchaModal = document.getElementById('projectCaptchaModal');
        if (captchaModal) {
            captchaModal.querySelector('.login-kicker').innerHTML = `<i class="fas fa-shield-alt"></i> ${t('captcha.kicker')}`;
            setButtonText(captchaModal.querySelector('.modal-header h3'), t('captcha.title'));
            captchaModal.querySelector('.modal-subtitle').textContent = t('captcha.sub');
            const answer = document.getElementById('projectCaptchaAnswer');
            if (answer) answer.placeholder = t('captcha.answer.ph');
            setButtonText(document.getElementById('projectCaptchaConfirm'), t('captcha.submit'));
        }

        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.querySelector('.settings-sidebar-head h3').textContent = t('settings.title');
            settingsModal.querySelector('.settings-sidebar-head p').textContent = t('settings.sub');
            setButtonText(document.getElementById('settingsSaveBtn'), t('settings.save'));
            applySettingsPanelTexts();
        }

        applyAdminPanelTexts();

        document.dispatchEvent(new CustomEvent('coredev-language-changed', { detail: { language: UI_LANG } }));
    }

    function applyAdminPanelTexts() {
        const adminModal = document.getElementById('adminModal');
        if (!adminModal) return;

        const head = adminModal.querySelector('.admin-sidebar-head');
        if (head) {
            head.querySelector('h3').textContent = t('admin.title');
            head.querySelector('p').textContent = t('admin.sub');
        }

        const navMap = {
            logs: 'admin.section.logs',
        };
        adminModal.querySelectorAll('.admin-nav-btn').forEach((btn) => {
            if (btn.dataset.adminSection === 'users') {
                const label = document.getElementById('adminUsersNavLabel');
                if (label) label.textContent = t('admin.section.users');
                return;
            }
            const key = navMap[btn.dataset.adminSection];
            if (!key) return;
            const label = document.getElementById(`${btn.dataset.adminSection === 'logs' ? 'adminLogs' : 'adminSupport'}NavLabel`);
            if (label) label.textContent = t(key);
        });

        const activeSection = adminModal.querySelector('.admin-nav-btn.active')?.dataset.adminSection || 'users';
        const title = document.getElementById('adminSectionTitle');
        if (title && activeSection !== 'users') {
            title.textContent = t(navMap[activeSection] || 'admin.section.logs');
        }

        const logsCard = adminModal.querySelector('.admin-logs-card');
        if (logsCard) {
            logsCard.querySelector('.settings-card-title').innerHTML = `<i class="fas fa-scroll"></i> ${t('admin.section.logs')}`;
            const sub = logsCard.querySelector('.admin-logs-sub');
            if (sub) sub.textContent = t('admin.logs.sub');
        }

        window.CoreDevAdmin?.applyUsersSectionRu?.();

        const manageModal = document.getElementById('adminUserManageModal');
        const manageKicker = manageModal?.querySelector('.admin-manage-kicker');
        if (manageKicker) {
            manageKicker.innerHTML = `<i class="fas fa-sliders-h"></i> ${t('admin.manage.kicker')}`;
        }

        const manageProfileSection = manageModal?.querySelector('[data-i18n="admin.manage.section.profile"]');
        if (manageProfileSection) manageProfileSection.textContent = t('admin.manage.section.profile');
        const manageDangerSection = manageModal?.querySelector('[data-i18n="admin.manage.section.danger"]');
        if (manageDangerSection) manageDangerSection.textContent = t('admin.manage.section.danger');

        const manageMap = {
            email: 'admin.edit.email',
            full_name: 'admin.edit.fullName',
            username: 'admin.edit.username',
            role: 'admin.edit.role',
            phone: 'admin.edit.phone',
            delete: 'admin.manage.delete',
        };
        const hintMap = {
            email: 'admin.manage.hint.email',
            full_name: 'admin.manage.hint.full_name',
            username: 'admin.manage.hint.username',
            role: 'admin.manage.hint.role',
            phone: 'admin.manage.hint.phone',
            delete: 'admin.manage.hint.delete',
        };

        manageModal?.querySelectorAll('.admin-manage-card[data-admin-edit]').forEach((btn) => {
            const field = btn.dataset.adminEdit;
            const title = btn.querySelector('.admin-manage-card-title');
            const hint = btn.querySelector('.admin-manage-card-hint');
            if (title && manageMap[field]) title.textContent = t(manageMap[field]);
            if (hint && hintMap[field]) hint.textContent = t(hintMap[field]);
        });

        const deleteConfirm = document.getElementById('adminUserDeleteConfirm');
        if (deleteConfirm) deleteConfirm.textContent = t('admin.delete.submit');

        const deleteCancel = document.getElementById('adminUserDeleteCancel');
        if (deleteCancel) deleteCancel.textContent = t('admin.delete.cancel');
    }

    function applySettingsPanelTexts() {
        window.CoreDevSettings?.applySettingsNavLabels?.();

        const active = document.querySelector('.settings-nav-btn.active')?.dataset.settingsSection || 'security';
        window.CoreDevSettings?.switchSection?.(active);

        const theme = document.getElementById('settingsTheme');
        if (theme?.options[0]) theme.options[0].textContent = t('settings.theme.dark');
        if (theme?.options[1]) theme.options[1].textContent = t('settings.theme.light');
        if (theme?.options[2]) theme.options[2].textContent = t('settings.theme.system');

        const lang = document.getElementById('settingsLanguage');
        if (lang?.options[0]) lang.options[0].textContent = t('settings.lang.ru');

        const langFixed = document.querySelector('.settings-lang-fixed');
        if (langFixed) langFixed.textContent = t('settings.lang.ru');

        const modal = document.getElementById('settingsModal');
        if (!modal) return;

        const setCardTitle = (panel, index, key) => {
            const card = modal.querySelector(`[data-settings-panel="${panel}"] .settings-card:nth-child(${index}) .settings-card-title`);
            if (!card) return;
            const icon = card.querySelector('i');
            const text = t(key);
            card.textContent = '';
            if (icon) card.appendChild(icon.cloneNode(true));
            card.appendChild(document.createTextNode(icon ? ` ${text}` : text));
        };

        setCardTitle('security', 1, 'settings.card.sessions');
        const sessionsSub = modal.querySelector('[data-settings-panel="security"] .settings-card:nth-child(1) .settings-card-sub');
        if (sessionsSub) sessionsSub.textContent = t('settings.card.sessions.sub');
        setButtonText(document.getElementById('settingsRevokeAllBtn'), t('settings.revokeAll'));
        setCardTitle('security', 2, 'settings.card.loginHistory');
        setCardTitle('security', 3, 'settings.card.verification');
        setCardTitle('security', 4, 'settings.card.captcha');

        setCardTitle('notifications', 1, 'settings.notify.email');
        const notifyPanel = modal.querySelector('[data-settings-panel="notifications"]');
        const emailSub = notifyPanel?.querySelector('.settings-notify-sub-email');
        if (emailSub) emailSub.textContent = t('settings.notify.emailSub');
        const notifyItems = notifyPanel?.querySelectorAll('.settings-notify-list .settings-notify-item');
        const notifyKeys = [
            ['settings.notify.reply', 'settings.notify.replyDesc'],
            ['settings.notify.status', 'settings.notify.statusDesc'],
            ['settings.notify.news', 'settings.notify.newsDesc'],
        ];
        notifyItems?.forEach((item, index) => {
            const [labelKey, descKey] = notifyKeys[index] || [];
            const label = item.querySelector('.settings-notify-label');
            const desc = item.querySelector('.settings-notify-desc');
            if (label && labelKey) label.textContent = t(labelKey);
            if (desc && descKey) desc.textContent = t(descKey);
        });
        setCardTitle('notifications', 2, 'settings.notify.push');
        const pushSub = notifyPanel?.querySelector('.settings-notify-sub-push');
        if (pushSub) pushSub.textContent = t('settings.notify.pushSub');
        const pushLabel = notifyPanel?.querySelector('.settings-notify-push-label');
        const pushDesc = notifyPanel?.querySelector('.settings-notify-desc-push');
        if (pushLabel) pushLabel.textContent = t('settings.notify.pushSite');
        if (pushDesc) pushDesc.textContent = t('settings.notify.pushDesc');
        setCardTitle('notifications', 3, 'settings.notify.freq');
        const freqSub = notifyPanel?.querySelector('.settings-notify-sub-freq');
        if (freqSub) freqSub.textContent = t('settings.notify.freqSub');
        const freqLabels = notifyPanel?.querySelectorAll('.settings-freq-label');
        const freqHints = notifyPanel?.querySelectorAll('.settings-freq-hint');
        const freqLabelKeys = ['settings.freq.immediate', 'settings.freq.daily', 'settings.freq.important'];
        const freqHintKeys = ['settings.freq.immediateHint', 'settings.freq.dailyHint', 'settings.freq.importantHint'];
        freqLabels?.forEach((node, index) => {
            if (freqLabelKeys[index]) node.textContent = t(freqLabelKeys[index]);
        });
        freqHints?.forEach((node, index) => {
            if (freqHintKeys[index]) node.textContent = t(freqHintKeys[index]);
        });

        setCardTitle('interface', 1, 'settings.card.theme');
        setCardTitle('interface', 2, 'settings.card.language');
        setCardTitle('interface', 3, 'settings.card.timezone');

        setCardTitle('privacy', 1, 'settings.card.visibility');
        const vis = document.getElementById('settingsProfileVisibility');
        if (vis?.options[0]) vis.options[0].textContent = t('settings.visibility.public');
        if (vis?.options[1]) vis.options[1].textContent = t('settings.visibility.hidden');
        const visSub = modal.querySelector('[data-settings-panel="privacy"] .settings-card-sub');
        if (visSub) visSub.textContent = t('settings.visibility.sub');

        setCardTitle('account', 1, 'settings.card.account');
        const accountSub = modal.querySelector('.settings-account-sub');
        if (accountSub) accountSub.textContent = t('settings.account.sub');

        const passwordBtn = document.getElementById('settingsOpenPasswordBtn');
        const deleteBtn = document.getElementById('settingsOpenDeleteBtn');
        const passwordTitle = passwordBtn?.querySelector('.settings-account-action-title');
        const passwordHint = passwordBtn?.querySelector('.settings-account-action-hint');
        const deleteTitle = deleteBtn?.querySelector('.settings-account-action-title');
        const deleteHint = deleteBtn?.querySelector('.settings-account-action-hint');
        if (passwordTitle) passwordTitle.textContent = t('settings.changePassword');
        if (passwordHint) passwordHint.textContent = t('settings.account.passwordHint');
        if (deleteTitle) deleteTitle.textContent = t('settings.deleteAccount');
        if (deleteHint) deleteHint.textContent = t('settings.account.deleteHint');

        const contactLabels = modal.querySelectorAll('[data-settings-panel="security"] .settings-phone-field label');
        contactLabels.forEach((label) => {
            const text = label.textContent.trim();
            if (text === 'Телефон' || text === 'Phone') setLabelText(label, null, t('form.phone'));
            if (text === 'Компания' || text === 'Company') setLabelText(label, null, t('form.company'));
            if (text === 'Направление' || text === 'Direction') setLabelText(label, null, t('form.position'));
            if (text === 'Валюта' || text === 'Budget' || text === 'Currency') setLabelText(label, null, t('form.budget'));
        });
    }

    function setLanguage(_lang) {
        applyLanguage(UI_LANG);
    }

    function initLanguage() {
        applyLanguage(UI_LANG);
    }

    window.CoreDevI18n = {
        t,
        getLanguage,
        setLanguage,
        applyLanguage,
        applySettingsPanelTexts,
        translateApiError,
        getLocale: () => 'ru-RU',
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLanguage);
    } else {
        initLanguage();
    }
})();
