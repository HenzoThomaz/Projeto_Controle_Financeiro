#serve pra validar os dados do formulario
from django import forms
from .models import Transacao
from .models import MetaFinanceira

class TransacaoForm(forms.ModelForm):
    class Meta:
        model = Transacao
        fields = ['tipo', 'valor', 'categoria', 'descricao', 'data']

#metas financeiras

class MetaFinanceiraForm(forms.ModelForm):
    class Meta:
        model = MetaFinanceira
        fields = ['nome_meta', 'descricao_meta', 'valor_objetivo_meta']

class AdicionarValorForm(forms.Form):
    valor = forms.DecimalField(max_digits=10, decimal_places=2, label="Adicionar valor")
    
