#serve pra validar os dados do formulario
from django import forms
from .models import Transacao,MetaOrcamento,MetaFinanceira

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
    
#orçamento mensal
class MetaOrcamentoForm(forms.ModelForm):
    # Sobrescreve o campo categoria para ser apenas leitura (não deve ser alterado)
    categoria = forms.CharField(
        label='Categoria',
        max_length=20,
        disabled=True, 
        required=False,
        widget=forms.TextInput(attrs={'readonly': 'readonly'})
    )
    
    class Meta:
        model = MetaOrcamento
        # O usuário e o mes_ano serão passados pela view/mantidos no Model, não pelo formulário
        fields = ['categoria', 'limite_mensal'] 
        widgets = {
            'limite_mensal': forms.NumberInput(attrs={'step': '0.01', 'min': '0'})
        }