ORDER FIX PATCH — for branch fix/buyer-seller-orders only

Contains ONLY src/App.tsx and src/types.ts.

1. Back up your repository first.
2. Ensure GitHub Desktop Current Branch is fix/buyer-seller-orders and there are no uncommitted changes.
3. Extract this ZIP and copy its src/App.tsx and src/types.ts to the matching paths in your repository.
4. Review Changes in GitHub Desktop before committing; do not commit if unrelated features disappear.
5. Test: buyer buys items from two different sellers; each seller sees only their own order; failed Firestore write leaves cart intact; filtering still works.
6. Only after tests pass, commit as: fix: route buyer orders to correct sellers
7. Publish branch and open PR against your team's branch that contains filtering.

IMPORTANT: This patch is code-reviewed but not tested against your Firebase project. It intentionally does not contain .env, .git or the full src directory. It does not deploy Firestore rules.
