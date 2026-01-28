import { describe, it, expect } from 'vitest';

describe('Hook Import Test', () => {
    it('should import the hook', async () => {
        const { useTaskEditor } = await import('../useTaskEditor');
        expect(useTaskEditor).toBeDefined();
    });
});
