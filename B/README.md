# B — Touch Experiments

This folder holds interactive experiments. Add each experiment as a standalone HTML file (one experiment = one file).

How to add a new experiment:
1. Save a file like `04-my-experiment.html` in the B/ folder.
2. Edit `B/index.html` and add a link:
   `<a href="04-my-experiment.html" data-title="My Experiment">04 — My Experiment</a>`
3. Commit & push to the repository.

Open via GitHub Pages:
- If Pages is enabled, the experiments index will be at:
  https://jeff-gompertz.github.io/CUseeme/B/index.html
- Or load the file directly from the repo in your browser or via a local static server.

Notes:
- The iframe approach keeps each experiment isolated (scripts/styles run inside iframe).
- Long-press anywhere in the index to advance to the next experiment.
