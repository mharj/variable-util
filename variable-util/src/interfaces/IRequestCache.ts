/**
 * interface for a request cache
 * @example
 * const exampleCache: IRequestCache = {
 *   isOnline() {
 *     return (typeof window !== 'undefined' && window.navigator && window.navigator.onLine) || true;
 *   },
 *   async fetchRequest(req: Request) {
 *     if (typeof window !== 'undefined' && window.caches) {
 *       const cache = await window.caches.open('fetch');
 *       return cache.match(req);
 *     }
 *     return undefined;
 *   },
 *   async storeRequest(req: Request, res: Response) {
 *     if (typeof window !== 'undefined' && window.caches) {
 *       const cache = await window.caches.open('fetch');
 *       req.headers.delete('Authorization');
 *       await cache.put(req, res.clone());
 *     }
 *   },
 * };
 */

export interface IRequestCache {
	/**
	 * check if the client is connected to the internet
	 */
	isOnline(): boolean;
	/**
	 * get the cached response for a request
	 */
	fetchRequest(req: Request): Promise<Response | undefined>;
	/**
	 * store the response for a request
	 */
	storeRequest(req: Request, res: Response): Promise<void>;
}
