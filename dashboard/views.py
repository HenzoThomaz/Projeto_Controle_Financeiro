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

#ponto antes de tudo para o ctrl z

@login_required
def metas_financeiras(request):
    # Lógica para processar o formulário quando ele é enviado (POST)
    if request.method == 'POST':
        form = MetaFinanceiraForm(request.POST)
        if form.is_valid():
            nova_meta = form.save(commit=False)
            # Se você precisar associar ao usuário logado, faça aqui:
            # nova_meta.usuario = request.user 
            nova_meta.save()
            return redirect('metas_financeiras') # Redireciona para a mesma página (padrão PRG)
    
    # Se não for POST, cria um formulário vazio
    else:
        form = MetaFinanceiraForm()

    # Pega todas as metas para exibir na lista (isso acontece em ambos os casos, POST com erro ou GET)
    metas = MetaFinanceira.objects.all().order_by('-data_criacao_meta')
    
    # Monta o contexto para enviar ao template
    context = {
        'metas': metas,
        'form': form  # AGORA o form sempre será enviado para o template!
    }
    
    return render(request, 'dashboard/metas.html', context)

def adicionar_valor(request, meta_id):
    meta = get_object_or_404(MetaFinanceira, id=meta_id)
    if request.method == 'POST':
        if 'adicionar_valor' in request.POST:
            form = AdicionarValorForm(request.POST)
            if form.is_valid():
                valor = form.cleaned_data['valor']
                meta.valor_atual_meta += valor
                meta.save()
                return redirect('metas_financeiras')

        elif 'excluir_meta' in request.POST:
            meta.delete()
            return redirect('metas_financeiras')
    else:
        form = AdicionarValorForm()
    return render(request, 'dashboard/adicionar_valor.html', {'meta': meta, 'form': form})

def excluir_meta(request, meta_id):
    meta = get_object_or_404(MetaFinanceira, id=meta_id)
    if request.method == 'POST':
        meta.delete()
    return redirect('metas_financeiras')
