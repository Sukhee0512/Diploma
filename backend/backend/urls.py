from django.urls import path
from appbackend import views,edituser
from backend import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/', views.checkService), # localhost:8000/user/ gehed views.checkService function duudna.
    path('useredit/', edituser.editcheckService), # localhost:8000/useredit/ gehed edituser.editcheckService function duudna.
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static('/media/', document_root=settings.MEDIA_ROOT) 