// src/utils/helpers.js

export const isTouchDevice = () => {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
};

export const showBanner = function (testo, isError = true) {
    let old = document.getElementById('global-banner');
    if (old) old.remove();

    let banner = document.createElement('div');
    banner.id = 'global-banner';
    banner.style.position = 'absolute';
    banner.style.top = '20px';
    banner.style.left = '50%';
    banner.style.transform = 'translateX(-50%) translateY(-20px)';
    banner.style.backgroundColor = isError ? '#ff7477' : '#4caf50'; // Rosso o verde
    banner.style.color = '#fff';
    banner.style.padding = '15px 30px';
    banner.style.border = '4px solid #fff';
    banner.style.borderRadius = '8px';
    banner.style.fontFamily = "'Courier New', Courier, monospace";
    banner.style.fontWeight = 'bold';
    banner.style.fontSize = '1.3rem';
    banner.style.zIndex = '10000';
    banner.style.boxShadow = '4px 4px 0 rgba(0,0,0,0.5)';
    banner.style.transition = 'all 0.3s ease-out';
    banner.style.opacity = '0';
    banner.innerText = testo;

    document.getElementById('game-container').appendChild(banner);

    // Animazione entrata
    setTimeout(() => {
        banner.style.transform = 'translateX(-50%) translateY(0)';
        banner.style.opacity = '1';
    }, 10);

    // Animazione uscita
    setTimeout(() => {
        if (document.body.contains(banner)) {
            banner.style.opacity = '0';
            banner.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => banner.remove(), 300);
        }
    }, 2500);
};

// Assegno showBanner al window per garantire compatibilità con le chiamate legacy
window.showBanner = showBanner;

export const multiTabChannel = new BroadcastChannel('neomon_session');
multiTabChannel.onmessage = (event) => {
    if (event.data === 'new_login') {
        // Distrugge il gioco in questa scheda sostituendo tutto l'HTML, 
        // ma NON fa il logout da Supabase!
        document.body.innerHTML = `
            <div style="background-color: #3E1E68; color: white; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: 'Courier New', monospace;">
                <h1 style="font-size: 3rem; text-shadow: 2px 2px 0px #000; color: #ff7477;">GIOCO SOSPESO</h1>
                <h2 style="margin-top: 20px;">Hai aperto Neomon in un'altra finestra.</h2>
                <p>Puoi chiudere questa scheda in modo sicuro.</p>
            </div>
        `;
    }
};

window.isRecoveryLink = window.location.href.includes('type=recovery');
