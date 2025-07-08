export class TableOfContents {
    contentRef: HTMLElement | undefined;
    headings: Array<{ id: string; text: string; level: number }> = $state([]);
    private observer: MutationObserver | null = null;
    private static instance: TableOfContents

    private constructor(contentRef: HTMLElement | undefined) {
        this.contentRef = contentRef;
        if (contentRef) {
            this.initializeObserver();
        }
    }

    static getInstance(contentRef?: HTMLElement): TableOfContents {
        if (!TableOfContents.instance) {
            TableOfContents.instance = new TableOfContents(contentRef);
        } else if (contentRef) {
            TableOfContents.instance.updateContentRef(contentRef);
        }
        return TableOfContents.instance;
    }

    updateContentRef(newRef: HTMLElement | undefined) {
        this.observer?.disconnect();
        this.contentRef = newRef;
        if (newRef) {
            this.initializeObserver();
        } else {
            this.headings = [];
        }
    }

    private extractHeadings() {
        if (!this.contentRef) return;
        const headingElements = this.contentRef.querySelectorAll('h1, h2, h3, h4, h5, h6');

        this.headings = Array.from(headingElements)
            .map((heading) => {
                const level = parseInt(heading.tagName.charAt(1));
                const text = heading.textContent || '';
                const id = heading.id || text.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                if (!heading.id) heading.id = id;

                return { id, text, level };
            })
            .filter((heading): heading is { id: string; text: string; level: number } =>
                heading.text !== null && heading.text !== ''
            );
    }

    private initializeObserver() {
        this.extractHeadings();

        this.observer = new MutationObserver(() => this.extractHeadings());
        if (!this.contentRef) return;
        this.observer.observe(this.contentRef, {
            childList: true,
            subtree: true
        });
    }

    destroy() {
        this.observer?.disconnect();
    }
}
