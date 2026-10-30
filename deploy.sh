#!/usr/bin/env bash
# Zdalny deploy app_games na serwer produkcyjny (ops02.jdblayer.com).
# Laczy sie przez SSH (ProxyJump przez bastion) i wywoluje na serwerze
# production_manager.sh z projects_manager, ktory sam pobiera kod z GitHuba (git pull),
# buduje front (BUILD_CMD z games.env) i restartuje usluge systemd `games`.
# Ten skrypt tylko WYZWALA to zdalnie z maszyny dev - sam nie robi pull ani restartu.
#
# Uzycie:
#   1) git push origin main     (zmiany musza byc juz na GitHubie)
#   2) ./deploy.sh              # domyslna akcja: update
#      ./deploy.sh setup        # pierwsze wdrozenie (patrz AGENTS.md: wymagania wstepne)
#      ./deploy.sh status|restart|logs
#
# Hosty biora sie ze zmiennych srodowiska albo z lokalnego, NIEwersjonowanego
# pliku .env.deploy (wzor: .env.deploy.example) - dane serwera nie leza w repo:
#   DEPLOY_JUMP_HOST    np. "uzytkownik@domena-bastionu"
#   DEPLOY_TARGET_HOST  np. "uzytkownik@adres-serwera"
#   DEPLOY_APP_NAME     domyslnie "games"
#   DEPLOY_JOB_SCRIPT   domyslnie "/opt/apps/projects_manager/production_manager.sh"
#   DEPLOY_PUBLIC_URL   domyslnie "https://ops02.jdblayer.com" (kontrola po wdrozeniu)
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

if [ -f ".env.deploy" ]; then
    # shellcheck disable=SC1091
    source ".env.deploy"
fi

: "${DEPLOY_JUMP_HOST:?Ustaw DEPLOY_JUMP_HOST (w .env.deploy albo export), np. uzytkownik@domena-bastionu}"
: "${DEPLOY_TARGET_HOST:?Ustaw DEPLOY_TARGET_HOST (w .env.deploy albo export), np. uzytkownik@adres-serwera}"

APP_NAME="${DEPLOY_APP_NAME:-games}"
JOB_SCRIPT="${DEPLOY_JOB_SCRIPT:-/opt/apps/projects_manager/production_manager.sh}"
PUBLIC_URL="${DEPLOY_PUBLIC_URL:-https://ops02.jdblayer.com}"
URL_PREFIX="/games"

ACTION="${1:-update}"
ALLOWED_ACTIONS=(setup update status restart logs)
action_ok=0
for a in "${ALLOWED_ACTIONS[@]}"; do
    [ "$a" = "$ACTION" ] && action_ok=1 && break
done
if [ "$action_ok" -ne 1 ]; then
    echo "Nieznana akcja: '${ACTION}'. Dozwolone: ${ALLOWED_ACTIONS[*]}" >&2
    exit 1
fi

# Serwer wdraza to, co jest na GitHubie, nie to, co lezy lokalnie - ostrzegamy, gdy sie rozjezdza.
if [ "$ACTION" = "update" ] || [ "$ACTION" = "setup" ]; then
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        if [ -n "$(git status --porcelain)" ]; then
            echo "UWAGA: niezacommitowane zmiany - serwer ich nie zobaczy." >&2
        fi
        if git rev-parse '@{u}' >/dev/null 2>&1 && [ -n "$(git log '@{u}..HEAD' --oneline)" ]; then
            echo "UWAGA: lokalne commity nie sa wypchniete (git push) - serwer ich nie zobaczy." >&2
        fi
    else
        echo "UWAGA: to nie jest repozytorium gita - serwer pobiera kod z GitHuba, upewnij sie, ze jest tam aktualny." >&2
    fi
fi

echo "Wdrazanie '${APP_NAME}' (akcja: ${ACTION}) na ${DEPLOY_TARGET_HOST} (przez ${DEPLOY_JUMP_HOST})..."
# -t: production_manager.sh wymaga roota, wiec sudo moze zapytac o haslo na terminalu.
ssh -t -J "${DEPLOY_JUMP_HOST}" "${DEPLOY_TARGET_HOST}" \
    "sudo ${JOB_SCRIPT} ${ACTION} ${APP_NAME}"

# Kontrola po wdrozeniu (regula 10 AGENTS.md projects_manager: wspolny vhost z moderacja).
if [ "$ACTION" = "setup" ] || [ "$ACTION" = "update" ] || [ "$ACTION" = "restart" ]; then
    code() { curl -s -o /dev/null -m 15 -w '%{http_code}' "$1" || true; }
    games="$(code "${PUBLIC_URL}${URL_PREFIX}/")"
    root="$(code "${PUBLIC_URL}/")"
    echo "Kontrola: ${PUBLIC_URL}${URL_PREFIX}/ -> ${games} (oczekiwane 200), ${PUBLIC_URL}/ -> ${root} (oczekiwane 302)"
    if [ "$games" != "200" ] || [ "$root" != "302" ]; then
        echo "BLAD kontroli po wdrozeniu - sprawdz: ./deploy.sh status, ./deploy.sh logs" >&2
        exit 1
    fi
fi

echo "Deploy zakonczony."
