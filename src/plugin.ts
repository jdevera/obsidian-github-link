/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Notice, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, GithubLinkPluginSettingsTab } from "./settings";
import { Logger } from "./logger";

import type { GithubLinkPluginData, GithubLinkPluginSettings } from "./settings";
import { InlineRenderer } from "./inline/inline";
import { createInlineViewPlugin } from "./inline/view-plugin";
import { RequestCache } from "./github/cache";
import { QueryProcessor } from "./query/processor";
import { DATA_VERSION } from "./settings/types";

export const PluginSettings: GithubLinkPluginSettings = { ...DEFAULT_SETTINGS };
export const PluginData: GithubLinkPluginData = { settings: PluginSettings, dataVersion: DATA_VERSION };
export const logger = new Logger();
let cache: RequestCache;
export function getCache(): RequestCache {
	return cache;
}

export class GithubLinkPlugin extends Plugin {
	async onload() {
		const data = (await this.loadData()) || {};

		Object.assign(PluginSettings, data.settings);
		Object.assign(PluginData, data);
		logger.logLevel = PluginSettings.logLevel;

		cache = new RequestCache();
		await cache.init();

		// Migrate cache from data.json to IndexedDB (one-time)
		let needsSave = false;
		if (data.cache && Array.isArray(data.cache) && data.cache.length > 0) {
			const imported = await cache.importFromJSON(data.cache as string[]);
			logger.info(`Migrated ${imported} cache entries from data.json to IndexedDB.`);
			needsSave = true;
		}

		// Clean up legacy keys from data.json
		if (data.cache !== undefined || (data.settings as unknown as Record<string, unknown>)?.cacheIntervalSeconds !== undefined) {
			delete (PluginSettings as unknown as Record<string, unknown>).cacheIntervalSeconds;
			PluginData.cache = undefined;
			needsSave = true;
		}

		if (needsSave) {
			await this.saveData({ settings: PluginSettings, dataVersion: PluginData.dataVersion });
		}

		if (data.dataVersion === undefined || PluginData.dataVersion < DATA_VERSION) {
			// Always clear cache when data version changes
			const entriesDeleted = await cache.clean(new Date());
			PluginData.dataVersion = DATA_VERSION;
			await this.saveData({ settings: PluginSettings, dataVersion: DATA_VERSION });
			new Notice(
				`GitHub link data schema migrated to version ${DATA_VERSION}. Removed ${entriesDeleted} stored items from GitHub Link cache.`,
				3000,
			);
		}

		// Clean cache on startup
		const maxAge = new Date(new Date().getTime() - PluginSettings.maxCacheAgeHours * 60 * 60 * 1000);
		const entriesDeleted = await cache.clean(maxAge);
		if (entriesDeleted > 0) {
			logger.info(`Cleaned ${entriesDeleted} entries from request cache.`);
		}

		// To show all icons, logger.debug(getIconIds());

		this.addSettingTab(new GithubLinkPluginSettingsTab(this.app, this));
		this.registerMarkdownPostProcessor(InlineRenderer);
		this.registerEditorExtension(createInlineViewPlugin(this));
		this.registerMarkdownCodeBlockProcessor("github-query", QueryProcessor);
	}
}
