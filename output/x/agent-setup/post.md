# Setup post, @lepadev on X

Attach `agent-setup.png`. Post it Tuesday or Wednesday as a quote of Monday's week-1 thread, so anyone who asks "how?" lands on the numbers too.

Every claim is from `output/facebook/posts/PLAYBOOK.md`. "The tokens stay out of the repo" was checked on 27 Sep: no Meta token in any tracked file or in git history.

---

My marketing team is a Claude Code routine, a Meta developer app and one markdown file.

How the Facebook side works:
→ I created an app on developers.facebook.com and connected the LeadWing Page and my ad account. The tokens stay out of the repo.
→ The agent calls the Graph API directly. No Zapier, no scheduling tool.
→ It writes the posts, renders the images and schedules them on the Page.
→ It reads comments and the inbox, and pulls spend, clicks and landing views from the ads.
→ A Meta Pixel on the site, behind the cookie banner, shows which ads actually brought people in.

Twice a day it reads PLAYBOOK.md first, does all of that, and commits a log to git.

It can pause an ad that's wasting money. Posting, replying and ad changes wait for my yes.

Meta gotchas: the app has to be Live, not in development mode, before Meta lets it build ads. And a burst of API edits got my account flagged for a security check.

What would you let it do without asking?
