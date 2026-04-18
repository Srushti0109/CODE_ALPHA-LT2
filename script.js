const API_KEY = 'YOUR_GOOGLE_TRANSLATE_API_KEY_PLACEHOLDER';

const elements = {
    sourceLang: document.getElementById('sourceLang'),
    targetLang: document.getElementById('targetLang'),
    swapLang: document.getElementById('swapLang'),
    sourceText: document.getElementById('sourceText'),
    targetText: document.getElementById('targetText'),
    translateBtn: document.getElementById('translateBtn'),
    listenSource: document.getElementById('listenSource'),
    listenTarget: document.getElementById('listenTarget'),
    copyTarget: document.getElementById('copyTarget'),
    charCount: document.getElementById('charCount'),
    outputLoading: document.getElementById('outputLoading'),
    outputError: document.getElementById('outputError'),
    errorText: document.getElementById('errorText')
};

// Character count limit
const MAX_CHARS = 5000;

elements.sourceText.addEventListener('input', (e) => {
    const text = e.target.value;
    if (text.length > MAX_CHARS) {
        e.target.value = text.substring(0, MAX_CHARS);
    }
    elements.charCount.textContent = `${e.target.value.length} / ${MAX_CHARS}`;
});

// Swap languages
elements.swapLang.addEventListener('click', () => {
    const tempLang = elements.sourceLang.value;
    elements.sourceLang.value = elements.targetLang.value;
    elements.targetLang.value = tempLang;

    const tempText = elements.sourceText.value;
    elements.sourceText.value = elements.targetText.value;
    elements.targetText.value = tempText;
    
    // Update char count
    elements.charCount.textContent = `${elements.sourceText.value.length} / ${MAX_CHARS}`;
});

// Translate functionality using a placeholder function representing Google Translate API v2
const fetchTranslation = async (text, source, target) => {
    /* 
    // Actual API Integration Syntax for Google Translate API v2:
    // To use this, uncomment this block and add your API_KEY at the top.
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            q: text,
            source: source,
            target: target,
            format: 'text'
        })
    });
    
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return await response.json();
    */

    // Using Google's free translation endpoint for much better accuracy
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Translation API failed');
    }
    
    const data = await response.json();
    
    // Extract translated text from the nested array structure
    let translatedText = '';
    if (data && data[0]) {
        data[0].forEach(item => {
            if (item[0]) {
                translatedText += item[0];
            }
        });
    }

    if (!translatedText) {
        throw new Error('Translation failed');
    }
    
    // Format the response to match the expected structure
    return {
        data: {
            translations: [
                { translatedText: translatedText }
            ]
        }
    };
};

elements.translateBtn.addEventListener('click', async () => {
    const text = elements.sourceText.value.trim();
    if (!text) return;

    const source = elements.sourceLang.value;
    const target = elements.targetLang.value;

    // UI state: Loading
    elements.outputLoading.classList.remove('hidden');
    elements.outputError.classList.add('hidden');
    elements.targetText.value = '';

    try {
        const response = await fetchTranslation(text, source, target);
        const translatedText = response.data.translations[0].translatedText;
        
        // UI state: Success
        elements.targetText.value = translatedText;
    } catch (error) {
        // UI state: Error
        elements.errorText.textContent = error.message || "Translation failed.";
        elements.outputError.classList.remove('hidden');
    } finally {
        // Remove loading state
        elements.outputLoading.classList.add('hidden');
    }
});

// Copy to clipboard
elements.copyTarget.addEventListener('click', async () => {
    const text = elements.targetText.value;
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);
        
        // Visual feedback
        const icon = elements.copyTarget.querySelector('i');
        icon.classList.remove('fa-copy');
        icon.classList.add('fa-check');
        icon.style.color = '#10b981'; // Tailwind Green-500
        
        setTimeout(() => {
            icon.classList.remove('fa-check');
            icon.classList.add('fa-copy');
            icon.style.color = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
});

// Text-to-Speech (Web Speech API)
const speakText = (text, lang) => {
    if (!('speechSynthesis' in window)) {
        alert("Sorry, your browser doesn't support text-to-speech.");
        return;
    }

    if (!text) return;

    // Stop any currently playing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map of language codes for better Web Speech API compatibility
    const langMap = {
        'en': 'en-US',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'hi': 'hi-IN',
        'mr': 'mr-IN'
    };
    
    utterance.lang = langMap[lang] || lang;
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
};

elements.listenSource.addEventListener('click', () => {
    speakText(elements.sourceText.value, elements.sourceLang.value);
});

elements.listenTarget.addEventListener('click', () => {
    speakText(elements.targetText.value, elements.targetLang.value);
});
