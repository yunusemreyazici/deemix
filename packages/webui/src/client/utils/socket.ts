class CustomSocket extends EventTarget {
	private socket: WebSocket | null = null;
	private listeners: Record<string, (data: any) => any> = {};

	get readyState() {
		return this.socket?.readyState ?? WebSocket.CLOSED;
	}

	connect() {
		if (
			this.socket?.readyState === WebSocket.OPEN ||
			this.socket?.readyState === WebSocket.CONNECTING
		)
			return;

		this.socket = new WebSocket(
			(location.protocol === "https:" ? "wss://" : "ws://") +
				location.host +
				"/"
		);
		this.socket.addEventListener("open", () => {
			this.dispatchEvent(new Event("open"));
		});
		this.socket.addEventListener("error", () => {
			this.dispatchEvent(new Event("error"));
		});
		this.socket.addEventListener("close", () => {
			this.dispatchEvent(new Event("close"));
		});
		this.socket.addEventListener("message", (event) => {
			const messageData = JSON.parse(event.data);
			this.listeners[messageData.key]?.(messageData.data);
		});
	}

	emit(key: string, data?: any) {
		if (this.readyState !== WebSocket.OPEN) return false;

		this.socket?.send(JSON.stringify({ key, data }));
	}

	on(key: string, cb: (data: any) => any) {
		if (!Object.keys(this.listeners).includes(key)) {
			this.listeners[key] = cb;
		}
	}

	off(key: string) {
		if (Object.keys(this.listeners).includes(key)) {
			delete this.listeners[key];
		}
	}
}

export const socket = new CustomSocket();
