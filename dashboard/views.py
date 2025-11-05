from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Sum
from datetime import date
from .models import Transacao, MetaFinanceira, MetaOrcamento
from .forms import TransacaoForm, MetaFinanceiraForm, AdicionarValorForm,MetaOrcamentoForm 
from decimal import Decimal



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

#novo dashboard que minino bouglas fez (que orgulho)

@login_required
def ver_dashboard2(request):
    transacoes = Transacao.objects.filter(user=request.user)
    receita_total = transacoes.filter(tipo="receita").aggregate(Sum("valor"))["valor__sum"] or 0
    despesa_total = transacoes.filter(tipo="despesa").aggregate(Sum("valor"))["valor__sum"] or 0
    saldo_atual = receita_total - despesa_total

    if request.method == "POST":
        form = TransacaoForm(request.POST)
        if form.is_valid():
            transacao = form.save(commit=False)
            transacao.user = request.user 
            transacao.save()

            return redirect("dashboard2") 
    else:
        form = TransacaoForm()

    context = {
        "saldo": saldo_atual,
        "receitas": receita_total,
        "despesas": despesa_total,
        "form": form,
    }
    
    return render(request, "dashboard/dashboard2.html", context)

#@login_required
#def orcamento_mensal(request):
 #   return render(request, "dashboard/orcamento_mensal.html")

@login_required
def dashboard_orcamento_mensal(request):
    usuario = request.user
    
    # 1. Definir o período (Mês/Ano Atual)
    hoje = date.today()
    primeiro_dia_mes = hoje.replace(day=1)
    
    # 2. Obter todas as categorias disponíveis (as mesmas da Transacao)
    categorias_choices = Transacao.CATEGORIA_CHOICES
    
    dados_orcamento = []
    
    for chave_cat, nome_cat in categorias_choices:
        
        # 3. Obter a meta para a categoria (ou criar uma temporária com limite 0)
        # Tenta obter a meta existente, ou cria uma nova instância não salva se não existir
        meta, criada = MetaOrcamento.objects.get_or_create(
            user=usuario,
            categoria=chave_cat,
            mes_ano=primeiro_dia_mes,
            defaults={'limite_mensal': Decimal('0.00')} # Define 0 como meta inicial se for a primeira vez
        )

        # 4. Calcular o gasto total na categoria no mês atual
        # Filtra por despesas e pelo intervalo do mês atual
        gastos_mes = Transacao.objects.filter(
            user=usuario,
            tipo='despesa', # Apenas despesas
            categoria=chave_cat,
            data__gte=primeiro_dia_mes, # Data maior ou igual ao primeiro dia do mês
            data__lte=hoje # Data menor ou igual ao dia atual
        ).aggregate(Sum('valor'))['valor__sum'] or Decimal('0.00')
        
        # 5. Calcular o restante
        restante = meta.limite_mensal - gastos_mes

        # 6. Adicionar os dados para o template
        dados_orcamento.append({
            'nome_categoria': nome_cat,
            'chave_categoria': chave_cat,
            'meta_id': meta.id, # Usado para o link de edição
            'limite': meta.limite_mensal,
            'gasto_atual': gastos_mes,
            'restante': restante,
            'porcentagem_gasta': (gastos_mes / meta.limite_mensal) * 100 if meta.limite_mensal > 0 else 0,
            'alerta_gasto': restante < 0 # Exemplo: alerta se ultrapassou a meta
        })

    contexto = {
        'dados_orcamento': dados_orcamento,
        'mes_exibicao': hoje.strftime("%B de %Y") 
    }
    
    return render(request, 'dashboard/orcamento_mensal.html', contexto)

# --- View para editar a meta ---
# Use um ModelForm para simplificar a edição
# Esteja pronto para criá-lo no próximo passo


@login_required
def editar_meta_orcamento(request, meta_id):
    # Obtém a meta, retorna 404 se não for encontrada ou não pertencer ao usuário
    meta = get_object_or_404(MetaOrcamento, id=meta_id, user=request.user)
    
    if request.method == 'POST':
        form = MetaOrcamentoForm(request.POST, instance=meta)
        if form.is_valid():
            form.save()
            return redirect('dashboard_orcamento_mensal') # Redireciona de volta ao dashboard
    else:
        # Preenche o formulário com os dados da meta existente
        form = MetaOrcamentoForm(instance=meta)
    
    contexto = {
        'form': form,
        'meta': meta
    }
    return render(request, 'dashboard/editar_meta_orcamento.html', contexto)
    
