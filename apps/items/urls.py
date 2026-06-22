from django.urls import path
from .views import (
    ItemsListView, ItemsCreateView, ItemsDetailView,
    ItemsUpdateView, ItemsDeleteView
)

urlpatterns = [
    path('', ItemsListView.as_view(), name='items-list'),
    path('create/', ItemsCreateView.as_view(), name='items-create'),
    path('<int:pk>/', ItemsDetailView.as_view(), name='items-detail'),
    path('<int:pk>/update/', ItemsUpdateView.as_view(), name='items-update'),
    path('<int:pk>/delete/', ItemsDeleteView.as_view(), name='items-delete'),
]