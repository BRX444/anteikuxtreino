/* =========================================================
   DADOS DO ANTEIKU XTREINO
   Para atualizar o site, edite este arquivo e envie pro GitHub.

   times    → cada time precisa de um "id" único (ex.: "t9").
   sessoes  → cada xtreino tem "titulo", "data" (AAAA-MM-DD) e as "quedas".
              Em cada queda, "resultados" liga o id do time à
              colocação ("pos", 1 = booyah) e às "kills".
              Quem não jogou a queda é só não colocar.
   regras   → "titulo" e "texto" (use \n para quebrar linha).
   config   → pontos por colocação (do 1º ao último) e por kill,
              links do Discord/WhatsApp (deixe "" pra esconder).

   Cuidado com as vírgulas e aspas: se o site ficar em branco,
   provavelmente faltou ou sobrou uma vírgula.
   ========================================================= */
window.XTREINO_DATA = {
  "config": {
    "nome": "Anteiku Xtreino",
    "pontosColocacao": [12, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0],
    "pontosPorKill": 1,
    "discord": "",
    "whatsapp": ""
  },
  "times": [],
  "sessoes": [],
  "regras": [
    {
      "titulo": "Horário e check-in",
      "texto": "Esteja na call 15 minutos antes do horário marcado.\nTime que não entrar até a sala fechar perde a queda."
    },
    {
      "titulo": "Formação dos times",
      "texto": "Cada time joga com 4 titulares e pode ter 1 reserva.\nTrocas de jogador só entre as quedas, nunca durante."
    },
    {
      "titulo": "Conduta",
      "texto": "Proibido teaming, uso de hack, emulador não declarado ou qualquer bug que dê vantagem.\nPunição: desclassificação do xtreino e possível banimento dos próximos."
    },
    {
      "titulo": "Envio de resultados",
      "texto": "Ao final de cada queda, o capitão manda print da tela de resultados no grupo.\nSem print, vale o que a organização registrou."
    }
  ]
};
