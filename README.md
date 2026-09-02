# SaltyBananaSlug's Games

A collection of party-game projects by **SaltyBananaSlug**.

## RatSlug

**RatSlug** is a system-independent Foundry VTT v13 social-deduction and improv party game. Players invent ridiculous personas, answer prompts and chat in character, then try to work out which real player is behind each persona.

The current build is **v0.1.5.4**.

### How a game works

1. The host starts RatSlug and players create anonymous personas with a name, biography, catchphrase, and image.
2. The host runs a round of exactly four prompts. Players can answer any unanswered prompt until identity voting opens.
3. Players can also talk publicly or privately in character while protecting their real identities.
4. After prompt four, every player matches each persona to a real player and chooses a Favorite Character.
5. Identity guesses and Favorite votes lock together when submitted.
6. The host scores the round. Each correct identity match is worth one point.
7. Beginning in round two, the lowest eligible scorer is revealed. Ties use current-round score as a tiebreaker, with the host resolving any remaining tie.
8. Revealed players stay in the game but are no longer eligible for the primary win.
9. An unrevealed player who correctly identifies the entire group wins immediately; otherwise the final unrevealed player wins. Multiple perfect players can share the win.
10. Favorite Character votes are tracked separately and may also produce co-winners.
11. When the game ends, Final Results reveal every persona's real player identity, final score, Favorite vote total, and winner summaries.

### Current quality-of-life features

- Mobile-first interface and floating launcher.
- 100 built-in prompts plus custom prompts, no-repeat random drawing, discarding, and deck reset.
- Old prompts remain answerable until voting opens.
- Newest prompts appear first.
- Synchronized updates preserve unsent drafts, scroll position, focus, and cursor position.
- Other players joining, saving personas, or submitting responses do not wipe what someone else is typing.
- Saved personas lock permanently, including after reconnecting.
- Public and persona-to-persona private chat.
- Host pause/resume controls.
- Host identity protection: the Host tab shows character information and status without exposing Foundry account names or persona-to-player mappings before normal reveals.
- Automatic round scoring, reveal logic, Favorite tracking, winner detection, and full finale reveal.

### Installation

Copy the `saltybananaslugs-ratslug` folder into your Foundry user data `Data/modules/` directory, restart Foundry, enable **SaltyBananaSlug's RatSlug** in your world, and launch it using the button at the bottom of the Players list.

The module is system-independent and targets **Foundry VTT v13**.

For implementation notes and version history, see [`saltybananaslugs-ratslug/README.md`](saltybananaslugs-ratslug/README.md).
