(function () {
    let currentMessageIndex = 0;
    let messages = [];
    let scrollContainer = null;
    let isFirstScroll = true;
    let messageCheckInterval = null;
    let progressBar = null;


    const createButton = (text, onClick) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.addEventListener('click', onClick);
        return button;
    };

    const findScrollContainer = () => {
        return document.querySelector('[data-testid="issue.views.issue-details.issue-layout.container-left"]');
    };

    const updateMessagesList = () => {
        scrollContainer = findScrollContainer();
        if (!scrollContainer) return;

        messages = Array.from(scrollContainer.querySelectorAll('.css-6d0gjp'));
        updateProgressBar();
    };

    const checkAndClickLoadMoreButton = () => {
        return new Promise((resolve) => {
            const loadMoreButton = scrollContainer.querySelector('button[data-testid="issue.activity.common.component.load-more-button.loading-button"]');

            if (loadMoreButton) {
                console.log("Load more button found, clicking...");
                const initialMessageCount = messages.length;
                loadMoreButton.click();

                let attempts = 0;
                const maxAttempts = 50; // 5 seconds max wait time

                const checkLoading = setInterval(() => {
                    attempts++;
                    console.log(`Checking for new messages... Attempt ${attempts}`);
                    updateMessagesList();

                    if (messages.length > initialMessageCount) {
                        clearInterval(checkLoading);
                        console.log(`Load more completed. New message count: ${messages.length}`);
                        resolve(true);
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkLoading);
                        console.log("Timeout reached while waiting for new messages");
                        resolve(false);
                    }
                }, 100);
            } else {
                console.log("No load more button found");
                resolve(false);
            }
        });
    };

    const scrollToMessage = async (direction) => {
        console.log(`Scrolling ${direction}`);
        updateMessagesList();
        console.log(`Current message count: ${messages.length}`);

        if (!scrollContainer || messages.length === 0) {
            console.log("No scroll container or messages");
            return;
        }

        // Remove glow from previous message
        const previousGlowingMessage = document.querySelector('.message-glow');
        if (previousGlowingMessage) {
            previousGlowingMessage.classList.remove('message-glow');
        }

        if (direction === 'up') {
            currentMessageIndex = Math.max(0, currentMessageIndex - 1);
        } else if (direction === 'down') {
            if (isFirstScroll) {
                currentMessageIndex = 0;
                isFirstScroll = false;
            } else if (currentMessageIndex >= messages.length - 1) {
                console.log("At last message, checking for more");
                const moreLoaded = await checkAndClickLoadMoreButton();
                if (moreLoaded) {
                    console.log("More content loaded, updating messages");
                    updateMessagesList();
                    currentMessageIndex++;
                    console.log(`New current index: ${currentMessageIndex}`);
                } else {
                    console.log("No more content to load");
                    return;
                }
            } else {
                currentMessageIndex = Math.min(messages.length - 1, currentMessageIndex + 1);
            }
        }

        const targetMessage = messages[currentMessageIndex];
        if (targetMessage) {
            console.log(`Scrolling to message at index ${currentMessageIndex}`);
            const containerRect = scrollContainer.getBoundingClientRect();
            const targetRect = targetMessage.getBoundingClientRect();
            const targetTop = targetRect.top - containerRect.top;
            const scrollOffset = targetTop - containerRect.height * 0.4;

            scrollContainer.scrollBy({
                top: scrollOffset,
                behavior: 'smooth'
            });
            console.log(`Scrolled by ${scrollOffset}px`);

            // Add glow effect to the target message
            targetMessage.classList.add('message-glow');

            // Remove the glow effect after animation completes
            setTimeout(() => {
                targetMessage.classList.remove('message-glow');
            }, 2000);
        } else {
            console.log(`No message found at index ${currentMessageIndex}`);
        }

        updateProgressBar();
    };


    const scrollToBottom = async () => {
        await checkAndClickLoadMoreButton();
        setTimeout(() => {
            scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
            updateMessagesList();
            currentMessageIndex = messages.length - 1;
        }, 100);

        updateProgressBar();
    };

    const scrollToTop = () => {
        updateMessagesList();
        if (!scrollContainer) return;
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        currentMessageIndex = 0;
        isFirstScroll = true;

        updateProgressBar();
    };


    const initializeNavigation = () => {
        // Create navigation container
        const navContainer = document.createElement('div');
        navContainer.id = 'jira-nav-container';

        // Create progress bar container
        const progressBarContainer = document.createElement('div');
        progressBarContainer.id = 'jira-progress-bar-container';
        progressBarContainer.appendChild(createProgressBar());

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'jira-button-container';

        buttonContainer.appendChild(createButton('↑', () => scrollToMessage('up')));
        buttonContainer.appendChild(createButton('↓', () => scrollToMessage('down')));
        buttonContainer.appendChild(createButton('Top', scrollToTop));
        buttonContainer.appendChild(createButton('Bottom', scrollToBottom));

        // Add progress bar and button containers to the navigation container
        navContainer.appendChild(progressBarContainer);
        navContainer.appendChild(buttonContainer);

        // Add navigation container to the page
        document.body.appendChild(navContainer);

        // Add a MutationObserver to watch for changes in the DOM
        const observer = new MutationObserver(() => {
            updateMessagesList();
        });

        observer.observe(document.body, { childList: true, subtree: true });
    };

    const createProgressBar = () => {
        progressBar = document.createElement('div');
        progressBar.id = 'jira-progress-bar';
        const progressFill = document.createElement('div');
        progressFill.id = 'jira-progress-fill';
        progressBar.appendChild(progressFill);
        return progressBar;
    };

    const updateProgressBar = () => {
        if (!progressBar) return;
        const progress = (currentMessageIndex + 1) / messages.length;
        const fillElement = progressBar.querySelector('#jira-progress-fill');
        fillElement.style.height = `${progress * 100}%`;
    };

    const startPollingForMessages = () => {
        messageCheckInterval = setInterval(() => {
            updateMessagesList();
            if (messages.length > 0) {
                clearInterval(messageCheckInterval); // Stop checking when messages are found
                initializeNavigation(); // Initialize the navigation buttons once messages are found
            }
        }, 2000); // Check every 2s
    };

    // Start polling for messages
    startPollingForMessages();


    window.debugScrollToMessage = scrollToMessage;

})();
