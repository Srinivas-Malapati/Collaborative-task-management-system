# Collaborative Task Manager

A real-time, high-performance task management system built with Next.js 14 and Server-Sent Events (SSE).

## 🚀 Features

*   **Real-Time Collaboration**: Updates flow instantly to all connected clients using a custom SSE implementation (no Firebase/Supabase).
*   **Efficient Synchronization**: Uses **Delta Updates** to transmit *only* changed fields (e.g., status changes) rather than re-sending the entire project payload (optimized for 2MB+ datasets).
*   **Optimistic UI**: Immediate interface updates with automatic rollback on server failure.
*   **Bonus Features**:
    *   **Undo/Redo**: Event-sourced history allows reversing actions.
    *   **Rate Limiting**: Token-bucket algorithm protects API endpoints.
    *   **Activity and Comments**: Granular event logging.

## 🏗️ Architecture Decisions

### 1. Data Store (In-Memory Event Sourcing)
*   **Decision**: We utilized a singleton in-memory store (`src/lib/store.ts`) with a structured event log.
*   **Why**: To demonstrate complex state management logic (dependencies, history, undo/redo) without the overhead of setting up a local Docker database for review.
*   **Persistence**: The store uses `globalThis` to survive Hot Module Replacement (HMR) during development.

### 2. Real-Time Sync Strategy (SSE)
*   **Protocol**: Server-Sent Events (SSE) over WebSockets.
*   **Justification**: SSE is lighter, firewall-friendly, and naturally better suited for unidirectional "server-to-client" updates compared to WebSockets.
*   **Efficiency**: We stream typed events (`task_update`, `comment_add`) containing *partial* payloads. This scaling strategy ensures bandwidth usage remains constant (`O(1)`) regardless of total project size (`O(N)`).

### 3. Frontend Architecture
*   **Framework**: Next.js 14 (App Router).
*   **State**: React `useReducer`-style pattern handles incoming streams to merge deltas into the local state seamlessly.

## ⚖️ Tradeoffs

*   **Memory vs. Persistence**: Currently, data lives in RAM. In a true production environment, the `store.ts` methods would map 1:1 to SQL queries (Postgres) or Redis commands. The interface logic would remain identical.
*   **Concurrency**: We use optimistic locking principles (conditional checks in the store). High-concurrency write conflicts would be handled by the database transaction layer in a hosted version.

## 🛠️ Setup & Run

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Open Browser**:
    Navigate to `http://localhost:3000/projects/p1`

    *Tip: Open the URL in two different windows to see real-time updates!*
