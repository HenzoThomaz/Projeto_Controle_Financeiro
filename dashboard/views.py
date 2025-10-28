from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Sum
from datetime import date
from .models import Transacao, MetaFinanceira
from .forms import TransacaoForm, MetaFinanceiraForm, AdicionarValorForm




@login_required
def dashboard(request):
    # Formulário
    if request.method == "POST":
        form = TransacaoForm(request.POST)
        if form.is_valid():
            transacao = form.save(commit=False)
            transacao.user = request.user  # vincula ao usuário logado
            transacao.save()
            return redirect("dashboard_dashboard")
    else:
        form = TransacaoForm()

    # Filtra dados só do usuário logado
    transacoes = Transacao.objects.filter(user=request.user)

    receita_total = transacoes.filter(tipo="receita").aggregate(Sum("valor"))["valor__sum"] or 0
    despesa_total = transacoes.filter(tipo="despesa").aggregate(Sum("valor"))["valor__sum"] or 0
    saldo_atual = receita_total - despesa_total

    # Mensal
    hoje = date.today()
    transacoes_mes = transacoes.filter(data__month=hoje.month, data__year=hoje.year)
    receita_mes = transacoes_mes.filter(tipo="receita").aggregate(Sum("valor"))["valor__sum"] or 0
    despesa_mes = transacoes_mes.filter(tipo="despesa").aggregate(Sum("valor"))["valor__sum"] or 0

    # Últimos 3 lançamentos
    ultimas_transacoes = transacoes.order_by("-data")[:3]

    context = {
        "form": form,
        "receita_total": receita_total,
        "despesa_total": despesa_total,
        "saldo_atual": saldo_atual,
        "receita_mes": receita_mes,
        "despesa_mes": despesa_mes,
        "ultimas_transacoes": ultimas_transacoes,
    }
    return render(request, "dashboard/dashboard.html", context) 

#função de metas financeiras, adicionar valor e criar nova meta

@login_required
def metas_financeiras(request):
    # Lógica para processar o formulário quando ele é enviado (POST)
    if request.method == 'POST':
        form = MetaFinanceiraForm(request.POST)
        if form.is_valid():
            nova_meta = form.save(commit=False)
            nova_meta.usuario = request.user 
            nova_meta.save()
            return redirect('metas_financeiras')
    
    else:
        form = MetaFinanceiraForm()
   
    metas = MetaFinanceira.objects.all().order_by('-data_criacao_meta')
    
    context = {
        'metas': metas,
        'form': form  
    }
    
    return render(request, 'dashboard/metas.html', context)

def adicionar_valor(request, meta_id):
    meta = get_object_or_404(MetaFinanceira, id=meta_id)
    if request.method == 'POST':
            form = AdicionarValorForm(request.POST)
            if form.is_valid():
                valor = form.cleaned_data['valor']
                meta.valor_atual_meta += valor
                meta.save()
                return redirect('metas_financeiras')

    else:
        return redirect('metas_financeiras')
    return render(request, 'dashboard/adicionar_valor.html', {'meta': meta, 'form': form})

def excluir_meta(request, meta_id):
    meta = get_object_or_404(MetaFinanceira, id=meta_id)
    if request.method == 'POST':
        meta.delete()
    return redirect('metas_financeiras')

#parte da views do historico
@login_required
def historico_transacoes(request):
    queryset = Transacao.objects.filter(user=request.user)
    queryset = queryset.order_by('-data')
    filtro_tipo = request.GET.get('tipo') # Tenta pegar 'tipo' da URL (Ex: ?tipo=receita)
    
    if filtro_tipo == 'receita':
        queryset = queryset.filter(tipo='receita')
    elif filtro_tipo == 'despesa':
        queryset = queryset.filter(tipo='despesa')
    
    contexto = {
        'transacoes': queryset,
        'filtro_ativo': filtro_tipo if filtro_tipo in ['receita', 'despesa'] else 'todos',
    }
    
    return render(request, 'dashboard/historico.html', contexto)

@login_required
def ver_dashboard2(request):
    transacoes = Transacao.objects.filter(user=request.user)
    receita_total = transacoes.filter(tipo="receita").aggregate(Sum("valor"))["valor__sum"] or 0
    despesa_total = transacoes.filter(tipo="despesa").aggregate(Sum("valor"))["valor__sum"] or 0
    saldo_atual = receita_total - despesa_total

    context = {
        "saldo": saldo_atual,
        "receitas": receita_total,
        "despesas": despesa_total,
    }
    if request.method == "POST":
        form = TransacaoForm(request.POST)
        if form.is_valid():
            transacao = form.save(commit=False)
            transacao.user = request.user  # vincula ao usuário logado
            transacao.save()
            return redirect("dashboard_dashboard")
        else:
            form = TransacaoForm()
    return render(request, "dashboard/dashboard2.html", context)
    
