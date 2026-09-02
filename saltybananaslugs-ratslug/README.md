# SaltyBananaSlug's RatSlug

RatSlug is a system-independent Foundry VTT v13 party game about invented personas, anonymous improv, and figuring out which liar is which.

## Version 0.1.5 automatic scoring and reveals

This build keeps the working v0.1.2 startup and display layer, remembers each user's active tab across synchronized updates, moves live prompts and immediate answers into Persona Chat, lights the Chat tab when responses exist, and supports public or persona-to-persona private messages. It intentionally does not yet alter RatSlug round or scoring rules.

### v0.1.3.1 corrections

- Prompt answers lock permanently when posted.
- The Chat tab glows when the current prompt has responses; it no longer displays a count.
- Personas preview their chosen image locally and lock permanently when saved.
- Leaving and rejoining cannot bypass a saved persona lock.
- The obsolete hidden RatSlug assignment and manual RatSlug reveal controls were removed.

### v0.1.4 additions

- Each round contains exactly four host-selected prompts.
- Current and earlier prompts from the round remain visible in Persona Chat.
- Chat glow clears when Chat is opened and lights again only for a newer response.
- A fifth prompt cannot be launched; the host opens identity voting after prompt four.
- Each player must match every other persona to a real player, using each player once.
- Each player must also choose one Favorite Character for the round.
- Identity guesses and the Favorite vote lock together and cannot be edited.
- The host sees only Locked/Waiting status and cannot begin the next round until everyone submits.

### v0.1.4.1 interface correction

- Prompts and prompt answers now have their own Prompts tab.
- Persona Chat contains only public and private character conversations.
- New response glow moved from Chat to Prompts.
- Opening Prompts clears the glow; a later response lights it again.
- New rounds automatically take players to Prompts rather than Chat.

### v0.1.5 additions

- Every unanswered prompt remains answerable until the host opens identity voting.
- Answers target and lock to their specific prompt, even after later prompts appear.
- Prompts glow for new answers submitted to any prompt in the round.
- Score Round automatically awards one point per correct persona match and updates totals.
- Round one has no reveal; round two and later reveal the lowest eligible score.
- Ties use current-round score as a tiebreaker; a remaining tie is decided by the host.
- Revealed players continue participating but cannot win the primary contest.
- An unrevealed player who identifies the entire group wins; otherwise the last unrevealed player wins.
- Multiple perfect players can share the primary win.
- Favorite Character votes accumulate separately and allow co-winners.
- Round and final results have a dedicated Results tab.

### v0.1.5.1 draft preservation fix

- Synchronized updates no longer erase another player's unsaved persona fields.
- Local persona image previews survive other players joining or saving.
- Unsent prompt answers, chat messages, private recipients, identity matches, and Favorite votes also survive synchronized rerenders.
- Drafts remain local to each browser and are cleared when the host resets the game.

### v0.1.5.2 live UI preservation fix

- Synchronized updates preserve each player's scroll position, focused field, and text cursor.
- Drafts are recorded continuously while typing to close timing-sensitive gaps during shared-state redraws.
- The newest prompt now appears first, reducing scrolling on phones.

### v0.1.5.3 host identity protection

- The Host tab lists only character names, images, scores, and submission status.
- Foundry account names and persona-to-player mappings remain hidden from a participating GM until normal game reveals.

### v0.1.5.4 full finale reveal

- Final Results reveal every persona's real player identity after the game ends.
- The full group is ranked by final score and also shows Favorite Character vote totals.
- Main and Favorite Character winner summaries include real identities and their relevant totals.

## Features

- Players create a persona with a name, biography, catchphrase, and their own uploaded image.
- Images are resized locally before being shared, so players do not require Foundry file-upload permission.
- Anonymous in-character group chat.
- Mobile-first player interface with a floating launcher and phone-sized touch controls.
- Live prompt answers and chat, with a host-controlled Pause/Resume switch.
- 100 built-in prompts with random no-repeat drawing, manual selection, discarding, deck reset, and custom prompts.
- Simultaneous response board.
- Private identity matching and favorite-character voting.
- Phase controls, player reveals, and scoreboard.
- Works with any Foundry game system.

## Installation for local testing

Copy the `saltybananaslugs-ratslug` folder into Foundry's `Data/modules` directory, restart Foundry, enable the module in a world, and open RatSlug using the button at the bottom of the Players list.

## Suggested group

One host plus 5–8 players is ideal. Each participant should connect with a separate Foundry user account.
