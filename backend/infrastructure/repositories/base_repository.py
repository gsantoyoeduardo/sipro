from typing import Generic, TypeVar
from django.db import models

T = TypeVar('T', bound=models.Model)


class BaseRepository(Generic[T]):
    def __init__(self, model_class: type[T]):
        self.model_class = model_class

    def get_all(self, *args, **kwargs) -> models.QuerySet[T]:
        if args:
            return self.model_class.objects.filter(*args)
        return self.model_class.objects.filter(**kwargs)

    def get_by_id(self, id) -> T:
        return self.model_class.objects.get(pk=id)

    def create(self, data: dict) -> T:
        return self.model_class.objects.create(**data)

    def update(self, id, data: dict) -> T:
        obj = self.get_by_id(id)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, id) -> None:
        self.get_by_id(id).delete()

    def toggle_estado(self, id) -> bool:
        obj = self.get_by_id(id)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado
