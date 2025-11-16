// Mostrar e esconder o formulário principal de nova meta
document.addEventListener("DOMContentLoaded", function() {
    const abrir = document.getElementById("btn-abrir-form");
    const fechar = document.getElementById("btn-fechar-form");
    const form = document.getElementById("formulario-meta");

    abrir.addEventListener("click", () => form.style.display = "block");
    fechar.addEventListener("click", () => form.style.display = "none");

    // Mostrar/esconder os formulários de adicionar valor
    document.querySelectorAll(".btn-add").forEach(btn => {
        btn.addEventListener("click", () => {
            const metaId = btn.dataset.meta;
            document.getElementById(`addvalor-${metaId}`).style.display = "block";
        });
    });

    document.querySelectorAll(".btn-cancel").forEach(btn => {
        btn.addEventListener("click", () => {
            const metaId = btn.dataset.meta;
            document.getElementById(`addvalor-${metaId}`).style.display = "none";
        });
    });
});
