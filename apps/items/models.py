from django.db import models


class Item(models.Model):

    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(null=True, blank=True)
    hsn_sac_code = models.CharField(max_length=20, null=True, blank=True, db_index=True)
    quantity = models.PositiveIntegerField(default=0)
    rate = models.DecimalField(max_digits=15, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:

        db_table = "items"
        ordering = ["-id"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["hsn_sac_code"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity__gte=0),
                name="item_quantity_gte_zero",
            ),
        models.CheckConstraint(
            condition=models.Q(rate__gte=0),
            name="item_rate_gte_zero",
        ),
    ]

    def __str__(self):
        return self.name