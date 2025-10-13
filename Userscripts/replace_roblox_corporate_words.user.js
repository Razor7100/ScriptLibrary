// ==UserScript==
// @name         Replace Roblox's Corporate Words
// @namespace    http://tampermonkey.net/
// @version      0.2.7
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
        connection: 'friend',
        connections: 'friends',
        charts: 'discover',
        marketplace: 'catalog',
        communities: 'groups',
        community: 'group',
        experiences: 'games',
        experience: 'game',
        connect: 'Friends',
        connected: 'Added'
    };

    const avatarEditorReplacements = {
        'recently acquired': 'recently purchased',
        'recently worn': 'all'
    };

    const groupPageReplacements = {
        'followers': 'members'
    };

    const isGroupPage = () => location.href.startsWith('https://www.roblox.com/communities/');
    const isAvatarEditorPage = () => location.href.startsWith('https://www.roblox.com/my/avatar');

    let replacements = { ...baseReplacements };
    if (isGroupPage()) {
        Object.assign(replacements, groupPageReplacements);
    } else if (isAvatarEditorPage()) {
        Object.assign(replacements, avatarEditorReplacements);
    }

    function processText(text) {
        for (const [key, value] of Object.entries(replacements)) {
            const regex = new RegExp(`\\b${key}\\b`, 'gi');
            text = text.replace(regex, match => preserveCase(match, value));
        }
        return text;
    }

    function preserveCase(original, replacement) {
        if (original === original.toUpperCase()) return replacement.toUpperCase();
        if (original[0] === original[0].toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
        return replacement;
    }

    function replaceTextNode(textNode) {
        if (
            textNode.nodeType === Node.TEXT_NODE &&
            !isExcludedContainer(textNode.parentNode)
        ) {
            const newText = processText(textNode.textContent);
            if (textNode.textContent !== newText) {
                textNode.textContent = newText;
            }
        }
    }

    function replaceAttributes(node) {
        const attributesToCheck = ['alt', 'placeholder', 'title'];
        for (const attr of attributesToCheck) {
            if (node.hasAttribute(attr)) {
                const original = node.getAttribute(attr);
                const updated = processText(original);
                if (original !== updated) {
                    node.setAttribute(attr, updated);
                }
            }
        }
    }

    function isExcludedContainer(node) {
        while (node && node.nodeType === Node.ELEMENT_NODE) {
            if (
                node.classList.contains('dialog-message-body') ||
                (node.id === 'chat-friends' && node.classList.contains('chat-friends')) ||
                node.classList.contains('group-shout-content') ||
                node.classList.contains('profile-about') || // excluded here
                (node.classList.contains('comment') &&
                 node.classList.contains('list-item') &&
                 node.classList.contains('ng-scope'))
            ) {
                return true;
            }
            node = node.parentElement;
        }
        return false;
    }

    function walkDOM(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            replaceAttributes(node);
        }

        if (node.nodeType === Node.TEXT_NODE) {
            replaceTextNode(node);
        } else if (
            node.nodeType === Node.ELEMENT_NODE &&
            !isExcludedContainer(node)
        ) {
            node.childNodes.forEach(child => walkDOM(child));
        }
    }

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => walkDOM(node));
            if (mutation.type === 'characterData') {
                replaceTextNode(mutation.target);
            }
        });
    });

    walkDOM(document.body);

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
})();
