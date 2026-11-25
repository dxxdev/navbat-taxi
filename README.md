# NavbatTaksi

A taxi queue and seat reservation application connecting passengers and drivers through route-based seat availability and a queue system.

## Project Overview

NavbatTaksi is a cross-platform application designed to simplify finding available taxi seats, joining a passenger queue, and managing trips.

The application provides a shared platform for passengers and drivers.

### Main Goals

- Simplify finding available taxi routes.
- Allow drivers to publish routes and available seats.
- Allow passengers to join a queue for a route.
- Manage queue order and booking confirmation.
- Automatically expire offers when passengers fail to respond in time.

## User Roles

### Passenger

- Browse available routes.
- View route information.
- Join a queue.
- Monitor queue position and status.
- Confirm a seat offer.
- Cancel an active queue entry.

### Driver

- Create and publish routes.
- Set departure time and available seats.
- View passengers in the queue.
- Manage route availability.
- Monitor booking statuses.

## Tech Stack

### Frontend

- React Native
- Expo
- TypeScript
- Expo Router

### Backend

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Realtime
- Supabase Edge Functions
- PostGIS

### Development Tools

- Git
- GitHub
- Visual Studio Code

## Platforms

- Android
- Web

## Project Status

> Early development — initial project setup.

- <input type="checkbox" checked> <del>Project planning</del>
- <input type="checkbox"> <span>Expo project setup</span>
- <input type="checkbox"> <span>Frontend architecture</span>
- <input type="checkbox"> <span>Navigation</span>
- <input type="checkbox"> <span>UI components</span>
- <input type="checkbox"> <span>Supabase integration</span>
- <input type="checkbox"> <span>Authentication</span>
- <input type="checkbox"> <span>Passenger features</span>
- <input type="checkbox"> <span>Driver features</span>
- <input type="checkbox"> <span>Queue management</span>
- <input type="checkbox"> <span>Booking system</span>
- <input type="checkbox"> <span>Realtime functionality</span>
- <input type="checkbox"> <span>Security implementation</span>
- <input type="checkbox"> <span>Testing</span>
- <input type="checkbox"> <span>Android build</span>
- <input type="checkbox"> <span>Web deployment</span>

## Getting Started

### Prerequisites

- Node.js (LTS)
- npm
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/dxxdev/navbat-taxi.git
```

Navigate to the project directory:
```bash
cd navbat-taksi
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npx expo start
```

Run on Web:
```bash
npx expo start --web
```

### Project Structure

Project structure will be documented and updated as the application architecture evolves

### Environment Varibles

Environment variables will be documented when backend integration is implemented.
Never commit private credentials, access tokens, or service role keys.

### Development Roadmap

1. Initialize the development environment.
2. Establish project architecture.
3. Implement navigation.
4. Create the UI design system.
5. Configure Supabase.
6. Implement authentication.
7. Develop passenger features.
8. Develop driver features.
0. Implement queue and booking logic.
10. Integrate realtime updates.
11. Test the application.
12. Prepare Android and Web builds.

### Development Log

Initial Planning

- Defined the core application concept.
- Established passenger and driver roles.
- Selected React Native and Expo.
- Selected Supabase as the backend platform.
- Planned Android and Web support.



### README bilan ishlash tartibimiz
 Har bir bosqichdan keyin README'ning tegishli bo'limini ham yangilab boramiz:
- **Features** — yangi funksiya qo'shilganda.
- **Tech Stack** — yangi texnologiya yoki kutubxona qo'shilganda.
- **Project Structure** — fayl va papkalar o'zgarganda.
- **Installation** — o'rnatish jarayoni o'zgarganda.
- **Project Status** — vazifa bajarilganda.
- **Development Log** — bosqich yakunlanganda.

>README har doim kodimizning haqiqiy holatiga mos bo'ladi. Hali yozilmagan funksiyalarni tayyor deb belgilamaymiz.