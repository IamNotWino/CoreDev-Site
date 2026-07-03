from . import views
from . import settings_views
from . import admin_views
from . import support_views
from . import content_views


API_GET_ROUTES = {
    "/api/block-status": views.block_status_view,
    "/api/captcha": views.captcha_challenge_view,
    "/api/reset-password/verify": views.password_reset_verify_view,
    "/api/password-reset/verify": views.password_reset_verify_view,
    "/api/settings": settings_views.settings_bundle_view,
    "/api/project-draft": settings_views.project_draft_view,
    "/api/content/team": content_views.content_team_list_view,
    "/api/content/projects": content_views.content_projects_list_view,
    "/api/admin/content/meta": content_views.admin_content_meta_view,
    "/api/admin/overview": admin_views.admin_overview_view,
    "/api/admin/notifications": admin_views.admin_notifications_view,
    "/api/admin/users": admin_views.admin_users_view,
    "/api/admin/logs": admin_views.admin_logs_view,
    "/api/support/messages": support_views.support_messages_view,
    "/api/admin/support/threads": support_views.admin_support_threads_view,
    "/api/admin/support/thread": support_views.admin_support_thread_view,
}


API_ROUTES = {
    "/api/security-check": views.security_check_view,
    "/api/register": views.register_view,
    "/api/register/confirm": views.register_confirm_view,
    "/api/register/resend": views.register_resend_view,
    "/api/login": views.login_view,
    "/api/logout": settings_views.logout_view,
    "/api/profile": views.profile_view,
    "/api/settings": settings_views.settings_bundle_view,
    "/api/settings/update": settings_views.settings_update_view,
    "/api/sessions/revoke-all": settings_views.sessions_revoke_all_view,
    "/api/project-draft/save": settings_views.project_draft_save_view,
    "/api/project-draft/delete": settings_views.project_draft_delete_view,
    "/api/change-password": views.change_password_view,
    "/api/forgot-password": views.password_reset_request_view,
    "/api/reset-password": views.password_reset_confirm_view,
    "/api/reset-password/verify": views.password_reset_verify_view,
    "/api/password-reset/request": views.password_reset_request_view,
    "/api/password-reset/confirm": views.password_reset_confirm_view,
    "/api/password-reset/verify": views.password_reset_verify_view,
    "/api/verify-email": views.verify_email_view,
    "/api/verify-email/resend": views.resend_email_verification_view,
    "/api/delete-account": views.delete_account_view,
    "/api/project-request": views.project_request_view,
    "/api/admin/overview": admin_views.admin_overview_view,
    "/api/admin/notifications": admin_views.admin_notifications_view,
    "/api/admin/users": admin_views.admin_users_view,
    "/api/admin/users/role": admin_views.admin_set_role_view,
    "/api/admin/users/update": admin_views.admin_update_user_view,
    "/api/admin/users/delete": admin_views.admin_delete_user_view,
    "/api/admin/logs": admin_views.admin_logs_view,
    "/api/support/messages": support_views.support_messages_view,
    "/api/admin/support/threads": support_views.admin_support_threads_view,
    "/api/admin/support/thread": support_views.admin_support_thread_view,
    "/api/admin/support/reply": support_views.admin_support_reply_view,
    "/api/admin/content/team": content_views.admin_team_create_view,
    "/api/admin/content/projects": content_views.admin_project_create_view,
    "/api/admin/content/team/delete": content_views.admin_team_delete_view,
    "/api/admin/content/projects/delete": content_views.admin_project_delete_view,
}


TEMPLATE_ROUTES = {
    "/": "/templates/preloader.html",
    "/app": "/templates/main.html",
    "/reset-password": "/templates/main.html",
    "/main.html": "/templates/main.html",
    "/preloader": "/templates/preloader.html",
    "/preloader.html": "/templates/preloader.html",
    "/404": "/templates/404-error.html",
    "/404.html": "/templates/404-error.html",
    "/404-error": "/templates/404-error.html",
    "/404-error.html": "/templates/404-error.html",
    "/404-eror": "/templates/404-error.html",
    "/404-eror.html": "/templates/404-error.html",
    "/403": "/templates/403-blocked.html",
    "/403.html": "/templates/403-blocked.html",
    "/403-blocked": "/templates/403-blocked.html",
    "/403-blocked.html": "/templates/403-blocked.html",
    "/400": "/templates/400-expired.html",
    "/400.html": "/templates/400-expired.html",
    "/400-expired": "/templates/400-expired.html",
    "/400-expired.html": "/templates/400-expired.html",
}

BLOCKED_ALLOWED_PATHS = {
    "/403",
    "/403.html",
    "/403-blocked",
    "/403-blocked.html",
    "/400",
    "/400.html",
    "/400-expired",
    "/400-expired.html",
}
