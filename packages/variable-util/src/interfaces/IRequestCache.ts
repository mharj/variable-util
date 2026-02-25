/**
 * interface for a request cache
 * @category Utils
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
 *     if (typeof window !== 'undefined' && window.caches && res.ok) {
 *       const cache = await window.caches.open('fetch');
 *       req.headers.delete('Authorization');
 *       await cache.put(req, res.clone());
 *     }
 *   },
 * };
 * @since v0.2.8
 */

export interface IRequestCache {
	/**
	 * check if the client is connected to the internet
	 */
	isOnline(): boolean;
	/**
	 * get the cached response for a Request
	 * @param {Request} req - Request to get the cached response for
	 * @returns {Promise<Response | undefined>} - Promise of Response or undefined
	 */
	fetchRequest(req: Request): Promise<Response | undefined>;
	/**
	 * store the response for a request
	 * @param {Request} req - Request to store the response for
	 * @param {Response} res - Response to store for the request
	 * @returns {Promise<void>} - Promise of void
	 */
	storeRequest(req: Request, res: Response): Promise<void>;
}
