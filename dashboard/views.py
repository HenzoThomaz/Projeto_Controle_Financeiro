from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.db.models import Sum
from datetime import date
from .models import Transacao
from .forms import TransacaoForm

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

@login_required
def metas(request):
    return render(request, "dashboard/metas.html")