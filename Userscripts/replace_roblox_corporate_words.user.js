// ==UserScript==
// @name         Replace Roblox's Corporate Words
// @namespace    http://tampermonkey.net/
// @version      0.2.4
// @description  Self Explanatory
// @author       Razor7100
// @match        https://www.roblox.com/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/Razor7100/ScriptLibrary/main/Userscripts/replace_roblox_corporate_words.user.js
// @updateURL    https://raw.githubusercontent.com/Razor7100/ScriptLibrary/main/Userscripts/replace_roblox_corporate_words.user.js
// ==/UserScript==

(function () {
    'use strict';

    const globalReplacements = {
        'connection': 'friend',
        'connections': 'friends',
        'charts': 'discover',
        'marketplace': 'catalog',
        'communities': 'groups',
        'community': 'group',
        'experiences': 'games',
        'experience': 'game'
    };

    const avatarEditorPageReplacements = {
        'recently acquired': 'recently purchased',
        'recently worn': 'all'
    };

    const groupPageReplacements = {
        'followers': 'members'
    };

    const isGroupPage = location.href.startsWith('https://www.roblox.com/communities/');
    const isAvatarEditorPage = location.href.startsWith('https://www.roblox.com/my/avatar');

    let replacements = { ...globalReplacements };

    if (isGroupPage) {
        replacements = { ...replacements, ...groupPageReplacements };
    }

    if (isAvatarEditorPage) {
        replacements = { ...replacements, ...avatarEditorPageReplacements };
    }

    function preserveCase(original, replacement) {
        const originalWords = original.split(/\s+/);
        const replacementWords = replacement.split(/\s+/);
        return replacementWords.map((word, i) => {
            if (!originalWords[i]) return word;
            const orig = originalWords[i];
            if (orig === orig.toUpperCase()) return word.toUpperCase();
            if (orig[0] === orig[0].toUpperCase()) return word[0].toUpperCase() + word.slice(1);
            return word;
        }).join(' ');
    }

    function processText(text) {
        for (const [key, value] of Object.entries(replacements)) {
            const pattern = new RegExp(`\\b${key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
            text = text.replace(pattern, match => preserveCase(match, value));
        }
        return text;
    }

    function processTextNode(textNode) {
        textNode.textContent = processText(textNode.textContent);
    }

    function processAttributeText(value) {
        return processText(value);
    }

    function replaceAttributes(node) {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const attributesToCheck = ['alt', 'placeholder'];
        for (const attr of attributesToCheck) {
            if (node.hasAttribute(attr)) {
                const original = node.getAttribute(attr);
                const updated = processAttributeText(original);
                if (original !== updated) {
                    node.setAttribute(attr, updated);
                }
            }
        }
    }

    function replaceTextContent(node) {
        const treeWalker = document.createTreeWalker(
            node,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    if (!node.parentNode || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.parentNode.nodeName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        while (treeWalker.nextNode()) {
            processTextNode(treeWalker.currentNode);
        }

        const allElements = node.querySelectorAll('*');
        for (const el of allElements) {
            replaceAttributes(el);
        }
    }

    let scheduled = false;
    let nodesToProcess = new Set();

    function scheduleProcessing() {
        if (scheduled) return;
        scheduled = true;
        setTimeout(() => {
            nodesToProcess.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    processTextNode(node);
                    if (node.parentNode) replaceAttributes(node.parentNode);
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    replaceTextContent(node);
                }
            });
            nodesToProcess.clear();
            scheduled = false;
        }, 50);
    }

    function observeMutations() {
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => nodesToProcess.add(node));
                } else if (mutation.type === 'characterData') {
                    nodesToProcess.add(mutation.target);
                } else if (mutation.type === 'attributes') {
                    nodesToProcess.add(mutation.target);
                }
            }
            scheduleProcessing();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['alt', 'placeholder']
        });
    }

    replaceTextContent(document.body);
    observeMutations();
})();
