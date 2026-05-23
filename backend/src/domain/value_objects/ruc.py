from dataclasses import dataclass

@dataclass(frozen=True)
class RUC:
    value: str

    def __post_init__(self):
        if not self.value or len(self.value) < 11:
            raise ValueError('RUC inválido: debe tener al menos 11 dígitos')
        if not self.value.isdigit():
            raise ValueError('RUC inválido: solo se permiten dígitos')

    def __str__(self):
        return self.value
