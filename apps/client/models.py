from django.db import models


class Client(models.Model):

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"

    name = models.CharField(max_length=255, db_index=True)
    phone = models.CharField(max_length=20, db_index=True)
    email = models.EmailField(max_length=255, blank=True, null=True, db_index=True)
    address = models.TextField(blank=True, null=True) 
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "clients"
        ordering = ["-id"]

        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["phone"]),
            models.Index(fields=["email"]),
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return self.name


# class ClientLog(models.Model):

#     class Action(models.TextChoices):
#         CREATE = "CREATE", "Create"
#         UPDATE = "UPDATE", "Update"
#         DELETE = "DELETE", "Delete"

#     client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True, related_name="logs")
#     action = models.CharField(max_length=20, choices=Action.choices, db_index=True)
#     reference_id = models.PositiveBigIntegerField(db_index=True)
#     old_data = models.JSONField(null=True, blank=True)
#     new_data = models.JSONField(null=True, blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         db_table = "client_logs"
#         ordering = ["-id"]

#         indexes = [
#             models.Index(fields=["action"]),
#             models.Index(fields=["reference_id"]),
#             models.Index(fields=["created_at"]),
#         ]

#     def __str__(self):
#         return f"{self.action} - {self.reference_id}"