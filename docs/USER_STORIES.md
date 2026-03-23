# GMB.live — User Stories & Use Cases

## Roles
- **Brand**: A company/seller that wants to run live-shopping campaigns
- **Creator**: A live-shopping host/streamer who promotes products on TikTok Shop, Instagram Live, etc.

---

## Authentication

| # | As a... | I want to... | So that... |
|---|---------|--------------|------------|
| A1 | New user | Sign up with email and password | I can create an account |
| A2 | Returning user | Log in with email and password | I can access my dashboard |
| A3 | Any user | Stay logged in across sessions | I don't have to log in every visit |
| A4 | Any user | Be redirected to onboarding after sign-up | I can set up my profile |

---

## Onboarding

| # | As a... | I want to... | So that... |
|---|---------|--------------|------------|
| O1 | New user | Select whether I'm a brand or creator | The app shows me the right experience |
| O2 | New brand | Enter my company name, industry, and website | Creators know who they're working with |
| O3 | New creator | Enter my handle, niche, platform stats, and bio | Brands can evaluate my profile |
| O4 | New creator | Upload photos of my past live streams | Brands can see my content quality |

---

## Brand — Products

| # | As a... | I want to... | So that... |
|---|---------|--------------|------------|
| P1 | Brand | Create a new product listing with name, description, images, and commission | Creators can apply to promote it |
| P2 | Brand | Edit my product listings | I can update pricing and details |
| P3 | Brand | Pause or close a product listing | I can stop receiving applications |
| P4 | Brand | View all my active product listings | I have an overview of my campaigns |
| P5 | Brand | See which creators have applied to each product | I can start deal negotiations |

---

## Creator — Feed & Discovery

| # | As a... | I want to... | So that... |
|---|---------|--------------|------------|
| F1 | Creator | Browse a feed of available products | I can find brands to work with |
| F2 | Creator | Filter products by category or commission range | I find relevant opportunities faster |
| F3 | Creator | View a brand's full product detail page | I can decide whether to apply |
| F4 | Brand | Browse a feed of creators | I can find the right hosts for my products |
| F5 | Brand | View a creator's full profile with stats and past work | I can decide who to reach out to |

---

## Deals & Negotiation

| # | As a... | I want to... | So that... |
|---|---------|--------------|------------|
| D1 | Brand | Send an offer to a creator with rate, deliverables, live date, and usage rights | We can start a deal negotiation |
| D2 | Creator | View incoming deal offers in my deal inbox | I know which brands have approached me |
| D3 | Creator | Accept an offer | A contract is generated and the deal moves forward |
| D4 | Creator | Counter an offer with different terms | I can negotiate a better deal |
| D5 | Brand | Counter a creator's counter-offer | We can reach mutually agreeable terms |
| D6 | Both | See the full negotiation history in the deal chat | We have a clear record of what was agreed |
| D7 | Both | Receive real-time messages in the deal chat | Negotiation is fast and fluid |

---

## Contracts

| # | As a... | I want to... | So that... |
|---|---------|--------------|------------|
| C1 | Both | See a generated contract once an offer is accepted | The deal terms are formally documented |
| C2 | Brand | Digitally sign the contract with my full name | I have a binding agreement |
| C3 | Creator | Digitally sign the contract with my full name | I have a binding agreement |
| C4 | Both | See who has signed and when | I know the contract status at a glance |
| C5 | Both | Be notified in the deal chat when both parties have signed | We can proceed to the next step |

---

## Escrow & Payment

| # | As a... | I want to... | So that... |
|---|---------|--------------|------------|
| E1 | Brand | Fund escrow once the contract is signed | The creator knows payment is secured |
| E2 | Creator | See that funds are held in escrow | I'm confident I'll be paid |
| E3 | Brand | Release escrow after approving the creator's analytics | The creator receives payment for successful delivery |

---

## Shipment

| # | As a... | I want to... | So that... |
|---|---------|--------------|------------|
| S1 | Brand | Enter tracking number and carrier to mark product as shipped | The creator knows the product is on its way |
| S2 | Creator | See shipment status and tracking info | I know when to expect the product |
| S3 | Creator | Confirm product delivery | The deal can move to the live stage |
| S4 | Brand | Update shipment status (shipped → in transit → delivered) | The tracker reflects real-world progress |

---

## Analytics

| # | As a... | I want to... | So that... |
|---|---------|--------------|------------|
| AN1 | Creator | Submit live stream analytics (GMV, orders, viewers, likes, watch time) | The brand can see the campaign results |
| AN2 | Creator | Add a link to the stream recording | The brand has proof of the campaign |
| AN3 | Brand | Review submitted analytics | I can verify the creator's claims |
| AN4 | Brand | Approve the analytics | Funds are released from escrow |

---

## Messaging

| # | As a... | I want to... | So that... |
|---|---------|--------------|------------|
| M1 | Any user | Send direct messages to another user | I can communicate outside of deal rooms |
| M2 | Any user | View my message inbox | I see all active conversations |
| M3 | Any user | Open a conversation thread | I can read and reply to messages |

---

## Profile & Settings

| # | As a... | I want to... | So that... |
|---|---------|--------------|------------|
| PR1 | Any user | View and edit my public profile | My information stays up to date |
| PR2 | Any user | Upload a profile photo | My profile looks professional |
| PR3 | Brand | Update my company info and industry | Creators see accurate brand details |
| PR4 | Creator | Update my platform handles and stats | Brands see my latest reach |

---

## Future Features (Backlog)

| # | Feature | Description |
|---|---------|-------------|
| BK1 | Ratings & reviews | After deal completion, both parties rate each other |
| BK2 | Google OAuth | Sign in with Google for faster onboarding |
| BK3 | Email notifications | Notify users of new offers, messages, and status changes |
| BK4 | Analytics dashboard | Brand-level dashboard showing aggregate campaign ROI |
| BK5 | Creator search & filters | Advanced search for creators by platform, GMV range, niche |
| BK6 | Stripe integration | Real escrow payments via Stripe Connect |
| BK7 | Product media uploads | Brands upload product images/videos to their listings |
| BK8 | Deal templates | Brands save offer templates for repeat campaigns |
| BK9 | Notification center | In-app notification bell for all deal activity |
| BK10 | Mobile app | Native iOS/Android app |
