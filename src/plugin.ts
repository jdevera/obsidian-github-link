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
import { initKeychain, loadTokens, migrateTokens } from "./keychain";

export const PluginSettings: GithubLinkPluginSettings = { ...DEFAULT_SETTINGS };
export const PluginData: GithubLinkPluginData = { cache: null, settings: PluginSettings, dataVersion: DATA_VERSION };
export const logger = new Logger();
let cache: RequestCache;

export function getCache(): RequestCache {
	return cache;
}

export class GithubLinkPlugin extends Plugin {
	public cacheInterval: number | undefined;
	async onload() {
		const data = (await this.loadData()) || {};

		Object.assign(PluginSettings, data.settings);
		Object.assign(PluginData, data);
		logger.logLevel = PluginSettings.logLevel;

		cache = new RequestCache(PluginData.cache);
		initKeychain(this.app.secretStorage);

		if (data.dataVersion === undefined || PluginData.dataVersion < DATA_VERSION) {
			const entriesDeleted = cache.clean(new Date());
			PluginData.cache = null;
			PluginData.dataVersion = DATA_VERSION;

			migrateTokens(PluginSettings.accounts);

			await this.saveData(this.getDataForSave());
			new Notice(
				`GitHub link data schema migrated to version ${DATA_VERSION}. Removed ${entriesDeleted} stored items from GitHub Link cache.`,
				3000,
			);
		}

		loadTokens(PluginSettings.accounts);

		// Clean cache
		const maxAge = new Date(new Date().getTime() - PluginSettings.maxCacheAgeHours * 60 * 60 * 1000);
		const entriesDeleted = cache.clean(maxAge);
		if (entriesDeleted > 0) {
			PluginData.cache = cache.toJSON();
			await this.saveData(this.getDataForSave());
			logger.info(`Cleaned ${entriesDeleted} entries from request cache.`);
		}

		// To show all icons, logger.debug(getIconIds());

		this.addSettingTab(new GithubLinkPluginSettingsTab(this.app, this));
		this.registerMarkdownPostProcessor(InlineRenderer);
		this.registerEditorExtension(createInlineViewPlugin(this));
		this.registerMarkdownCodeBlockProcessor("github-query", QueryProcessor);
		this.setCacheInterval();
	}

	/**
	 * Returns plugin data with tokens stripped from accounts, for safe persistence to data.json.
	 */
	public getDataForSave(): GithubLinkPluginData {
		return {
			cache: PluginData.cache,
			settings: {
				...PluginSettings,
				accounts: PluginSettings.accounts.map((acc) => ({ ...acc, token: "" })),
			},
			dataVersion: DATA_VERSION,
		};
	}

	/**
	 * Save cache at regular interval
	 */
	public setCacheInterval(): void {
		const checkCache = async () => {
			logger.debug("Checking if cache needs a save.");
			if (cache.cacheUpdated) {
				PluginData.cache = cache.toJSON();
				await this.saveData(this.getDataForSave());
				cache.cacheUpdated = false;
				logger.info(`Saved request cache with ${PluginData.cache?.length} items.`);
			}
		};

		window.clearInterval(this.cacheInterval);
		this.cacheInterval = this.registerInterval(
			window.setInterval(() => {
				void checkCache();
			}, PluginSettings.cacheIntervalSeconds * 1000),
		);
	}
}
