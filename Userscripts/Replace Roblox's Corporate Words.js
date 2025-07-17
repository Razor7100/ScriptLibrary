// ==UserScript==
// @name         Replace Roblox's Corporate Words
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Self Eplanatory
// @author       Razor7100
// @match        https://www.roblox.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const replacements = {
        connection: 'friend',
        connections: 'friends',
        charts: 'discover',
        marketplace: 'catalog',
        communities: 'groups',
        community: 'group',
        experiences: 'games',
        experience: 'game'
    };

    function preserveCase(original, replacement) {
        if (original === original.toUpperCase()) {
            return replacement.toUpperCase();
        } else if (original[0] === original[0].toUpperCase()) {
            return replacement[0].toUpperCase() + replacement.slice(1);
        } else {
            return replacement;
        }
    }

    function processTextNode(textNode) {
        textNode.textContent = textNode.textContent.replace(/\b\w+\b/g, match => {
            const lower = match.toLowerCase();
            if (replacements.hasOwnProperty(lower)) {
                return preserveCase(match, replacements[lower]);
            }
            return match;
        });
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
    }

    function observeMutations() {
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            replaceTextContent(node);
                        } else if (node.nodeType === Node.TEXT_NODE) {
                            processTextNode(node);
                        }
                    });
                } else if (mutation.type === 'characterData') {
                    processTextNode(mutation.target);
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    replaceTextContent(document.body);
    observeMutations();
})();
