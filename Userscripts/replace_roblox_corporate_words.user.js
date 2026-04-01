// ==UserScript==
// @name         Replace Roblox's Corporate Words
// @namespace    http://tampermonkey.net/
// @version      0.2.8
// @description  Replaces certain corporate terms on Roblox with more user-friendly alternatives.
// @author       Razor7100
// @match        https://www.roblox.com/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/Razor7100/ScriptLibrary/main/Userscripts/replace_roblox_corporate_words.user.js
// @updateURL    https://raw.githubusercontent.com/Razor7100/ScriptLibrary/main/Userscripts/replace_roblox_corporate_words.user.js
// ==/UserScript==

(function () {
    'use strict';

    const baseReplacements = {
        charts: 'discover',
        marketplace: 'catalog',
        communities: 'groups',
        community: 'group',
        experiences: 'games',
        experience: 'game'
    };

    const pageReplacements = {
        'https://www.roblox.com/communities/': {
            followers: 'members'
        },
        'https://www.roblox.com/my/avatar': {
            'recently acquired': 'recently purchased',
            'recently worn': 'all'
        }
    };

    const excludedClasses = [
        'dialog-message-body',
        'group-shout-content',
        'profile-about',
    ];

    const excludedIdClass = [
        ['chat-friends', 'chat-friends'],
    ];

    const excludedTagClass = [
        ['li', 'comment', 'list-item', 'ng-scope'],
    ];

    const replacements = { ...baseReplacements,
        ...(Object.entries(pageReplacements).find(([k]) => location.href.startsWith(k))?.[1] ?? {})
    };

    const processText = text => Object.entries(replacements).reduce((t, [k, v]) =>
        t.replace(new RegExp(`\\b${k}\\b`, 'gi'), m => preserveCase(m, v)), text);

    const preserveCase = (orig, repl) =>
        orig === orig.toUpperCase() ? repl.toUpperCase() :
        orig[0] === orig[0].toUpperCase() ? repl[0].toUpperCase() + repl.slice(1) : repl;

    function isExcluded(node) {
        while (node?.nodeType === Node.ELEMENT_NODE) {
            if (excludedClasses.some(c => node.classList.contains(c))) return true;
            if (excludedIdClass.some(([id, cls]) => node.id === id && node.classList.contains(cls))) return true;
            if (excludedTagClass.some(([tag, ...cls]) =>
                node.tagName.toLowerCase() === tag && cls.every(c => node.classList.contains(c)))) return true;
            node = node.parentElement;
        }
        return false;
    }

    function walkDOM(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (!isExcluded(node.parentNode)) {
                const updated = processText(node.textContent);
                if (updated !== node.textContent) node.textContent = updated;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE && !isExcluded(node)) {
            for (const attr of ['alt', 'placeholder', 'title']) {
                if (node.hasAttribute(attr)) {
                    const updated = processText(node.getAttribute(attr));
                    if (updated !== node.getAttribute(attr)) node.setAttribute(attr, updated);
                }
            }
            node.childNodes.forEach(walkDOM);
        }
    }

    walkDOM(document.body);
    new MutationObserver(ms => ms.forEach(m => {
        m.addedNodes.forEach(walkDOM);
        if (m.type === 'characterData') {
            const n = m.target;
            if (!isExcluded(n.parentNode)) {
                const updated = processText(n.textContent);
                if (updated !== n.textContent) n.textContent = updated;
            }
        }
    })).observe(document.body, { childList: true, subtree: true, characterData: true });

})();
