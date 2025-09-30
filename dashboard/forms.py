#serve pra validar os dados do formulario
from django import forms
from .models import Transacao

class TransacaoForm(forms.ModelForm):
    class Meta:
        model = Transacao
        fields = ['tipo', 'valor', 'categoria', 'descricao', 'data']
