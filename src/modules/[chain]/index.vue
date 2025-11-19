<script lang="ts" setup>
import MdEditor from 'md-editor-v3';
import PriceMarketChart from '@/components/charts/PriceMarketChart.vue';

import { Icon } from '@iconify/vue';
import {
  useBlockchain,
  useFormatter,
  useTxDialog,
  useWalletStore,
  useStakingStore,
  useParamStore,
} from '@/stores';
import { onMounted, ref } from 'vue';
import { useIndexModule, colorMap } from './indexStore';
import { computed } from '@vue/reactivity';

import CardStatisticsVertical from '@/components/CardStatisticsVertical.vue';
import ProposalListItem from '@/components/ProposalListItem.vue';
import ArrayObjectElement from '@/components/dynamic/ArrayObjectElement.vue'

const props = defineProps(['chain']);

const blockchain = useBlockchain();
const store = useIndexModule();
const walletStore = useWalletStore();
const format = useFormatter();
const dialog = useTxDialog();
const stakingStore = useStakingStore();
const paramStore = useParamStore()
const coinInfo = computed(() => {
  return store.coinInfo;
});

onMounted(() => {
  store.loadDashboard();
  walletStore.loadMyAsset();
  paramStore.handleAbciInfo()
  // if(!(coinInfo.value && coinInfo.value.name)) {
  // }
});
const ticker = computed(() => store.coinInfo.tickers[store.tickerIndex]);

const currName = ref("")
blockchain.$subscribe((m, s) => {
  if (s.chainName !== currName.value) {
    currName.value = s.chainName
    store.loadDashboard();
    walletStore.loadMyAsset();
    paramStore.handleAbciInfo()
  }
});
function shortName(name: string, id: string) {
  return name.toLowerCase().startsWith('ibc/') ||
    name.toLowerCase().startsWith('0x')
    ? id
    : name;
}

const comLinks = [
  {
    name: 'Website',
    icon: 'mdi-web',
    href: store.homepage,
  },
  {
    name: 'Twitter',
    icon: 'mdi-twitter',
    href: store.twitter,
  },
  {
    name: 'Telegram',
    icon: 'mdi-telegram',
    href: store.telegram,
  },
  {
    name: 'Github',
    icon: 'mdi-github',
    href: store.github,
  },
];

// wallet box
const change = computed(() => {
  const token = walletStore.balanceOfStakingToken;
  return token ? format.priceChanges(token.denom) : 0;
});
const color = computed(() => {
  switch (true) {
    case change.value > 0:
      return 'text-green-600';
    case change.value === 0:
      return 'text-grey-500';
    case change.value < 0:
      return 'text-red-600';
  }
});

function updateState() {
  walletStore.loadMyAsset()
}

function trustColor(v: string) {
  return `text-${colorMap(v)}`
}

const quantity = ref(100)
const qty = computed({
  get: () => {
    return parseFloat(quantity.value.toFixed(6))
  },
  set: val => {
    quantity.value = val
  }
})
const amount = computed({
  get: () => {
    return quantity.value * ticker.value.converted_last.usd || 0
  },
  set: val => {
    quantity.value = val / ticker.value.converted_last.usd || 0
  }
})

</script>

<template>
  <div>
    <div v-if="coinInfo && coinInfo.name" class="bg-base-100 rounded-lg shadow-md mb-6">
      <div class="grid grid-cols-2 md:grid-cols-3 p-6 gap-6">
        <div class="col-span-2 md:col-span-1">
          <div class="text-3xl font-bold text-main leading-tight">
            {{ coinInfo.name }} (<span class="uppercase">{{
              coinInfo.symbol
            }}</span>)
          </div>
          <div class="text-sm mt-2 flex items-center gap-2">
            {{ $t('index.rank') }}:
            <div class="badge text-xs px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800">
              #{{ coinInfo.market_cap_rank }}
            </div>
          </div>

          <div class="my-6 flex flex-wrap items-center gap-2">
            <a v-for="(item, index) of comLinks" :key="index" :href="item.href"
              class="link link-primary px-3 py-2 rounded-md no-underline hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-all duration-200">
              <Icon :icon="item?.icon" />
              <span class="ml-1 text-sm uppercase">{{ item?.name }}</span>
            </a>
          </div>

          <div>
            <div class="dropdown dropdown-hover w-full">
              <label>
                <div
                  class="bg-gray-50 dark:bg-gray-800 flex items-center justify-between px-6 py-5 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700">
                  <div>
                    <div class="font-semibold text-xl text-gray-700 dark:text-white leading-tight">
                      {{ ticker?.market?.name || '' }}
                    </div>
                    <div class="text-info text-sm mt-1">
                      {{ shortName(ticker?.base, ticker?.coin_id) }}/{{
                        shortName(ticker?.target, ticker?.target_coin_id)
                      }}
                    </div>
                  </div>

                  <div class="text-right">
                    <div class="text-xl font-semibold text-gray-700 dark:text-white leading-tight">
                      ${{ ticker?.converted_last?.usd }}
                    </div>
                    <div class="text-sm mt-1 font-medium" :class="store.priceColor">
                      {{ store.priceChange }}%
                    </div>
                  </div>
                </div>
              </label>
              <div class="dropdown-content pt-1">
                <div class="h-64 overflow-auto w-full shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
                  <ul class="menu w-full bg-gray-50 rounded-lg dark:bg-gray-800">
                    <li v-for="(item, index) in store.coinInfo.tickers" :key="index" @click="store.selectTicker(index)">
                      <div class="flex items-center justify-between hover:bg-base-100 rounded-lg transition-colors duration-200">
                        <div class="flex-1">
                          <div class="text-main text-sm" :class="trustColor(item.trust_score)">
                            {{ item?.market?.name }}
                          </div>
                          <div class="text-sm text-gray-500 dark:text-gray-400">
                            {{ shortName(item?.base, item?.coin_id) }}/{{
                              shortName(item?.target, item?.target_coin_id)
                            }}
                          </div>
                        </div>

                        <div class="text-base text-main font-medium">
                           ${{ item?.converted_last?.usd }}
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="flex gap-2">
              <label class="btn btn-primary !px-4 !py-2 my-5 text-white" for="calculator">
                <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <rect x="4" y="2" width="16" height="20" rx="2"></rect> <line x1="8" x2="16" y1="6" y2="6"></line> <line x1="16" x2="16" y1="14" y2="18"></line> <path d="M16 10h.01"></path> <path d="M12 10h.01"></path> <path d="M8 10h.01"></path> <path d="M12 14h.01"></path> <path d="M8 14h.01"></path> <path d="M12 18h.01"></path> <path d="M8 18h.01"></path> </g></svg>
              </label>
              <!-- Put this part before </body> tag -->
              <input type="checkbox" id="calculator" class="modal-toggle" />
              <div class="modal">
                <div class="modal-box">
                  <h3 class="text-lg font-bold">{{ $t('index.price_calculator') }}</h3>
                  <div class="flex flex-col w-full mt-5">
                    <div class="grid h-20 flex-grow card rounded-box place-items-center">
                      <div class="join w-full">
                        <label class="join-item btn">
                          <span class="uppercase">{{ coinInfo.symbol }}</span>
                        </label>
                        <input type="number" v-model="qty" min="0" placeholder="Input a number" class="input grow input-bordered join-item" />
                      </div>
                    </div>
                    <div class="divider">=</div>
                    <div class="grid h-20 flex-grow card rounded-box place-items-center">
                      <div class="join w-full">
                        <label class="join-item btn">
                          <span>USD</span>
                        </label>
                        <input type="number" v-model="amount" min="0" placeholder="Input amount" class="join-item grow input input-bordered" />
                      </div>
                    </div>
                  </div>
                </div>
                <label class="modal-backdrop" for="calculator">{{ $t('index.close') }}</label>
              </div>
              <a class="my-5 !text-white btn grow" :class="{'!btn-success': store.trustColor === 'green', '!btn-warning': store.trustColor === 'yellow'}" :href="ticker.trade_url"
                target="_blank">
                {{ $t('index.buy') }} {{ coinInfo.symbol || '' }}
              </a>
            </div>
          </div>
        </div>

        <div class="col-span-2">
          <PriceMarketChart />
        </div>
      </div>
      <div class="h-[1px] w-full bg-gray-100 dark:bg-gray-700"></div>
      <div class="max-h-[250px] overflow-auto p-6 text-sm leading-relaxed">
        <MdEditor :model-value="coinInfo.description?.en" previewOnly></MdEditor>
      </div>
      <div class="mx-6 flex flex-wrap items-center gap-2">
        <div v-for="tag in coinInfo.categories"
          class="mb-4 text-xs bg-gray-100 dark:bg-gray-800 px-3 rounded-full py-1">
          {{ tag }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 md:!grid-cols-3 lg:!grid-cols-6 mb-6">
      <div v-for="(item, key) in store.stats" :key="key">
        <CardStatisticsVertical v-bind="item" />
      </div>
    </div>

    <div v-if="blockchain.supportModule('governance')" class="bg-base-100 rounded-lg mt-6 shadow-md">
      <div class="px-6 pt-6 pb-4 text-xl font-semibold text-main">
        {{ $t('index.active_proposals') }}
      </div>
      <div class="px-6 pb-6">
        <ProposalListItem :proposals="store?.proposals" />
      </div>
      <div class="pb-8 text-center text-gray-500" v-if="store.proposals?.proposals?.length === 0">
        {{ $t('index.no_active_proposals') }}
      </div>
    </div>

    <div class="bg-base-100 rounded-lg mt-6 shadow-md">
      <div class="flex justify-between px-6 pt-6 pb-4 text-xl font-semibold text-main">
        <span class="truncate" >{{ walletStore.currentAddress || 'Not Connected' }}</span>
        <RouterLink v-if="walletStore.currentAddress"
          class="float-right text-sm cursor-pointer link link-primary no-underline font-medium hover:underline"
          :to="`/${chain}/account/${walletStore.currentAddress}`">{{ $t('index.more') }}</RouterLink>
      </div>
      <div class="grid grid-cols-1 md:!grid-cols-4 auto-cols-auto gap-6 px-6 pb-6">
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg px-5 py-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm mb-2 text-gray-600 dark:text-gray-400 font-medium">{{ $t('account.balance') }}</div>
          <div class="text-xl font-bold text-main leading-tight">
            {{ format.formatToken(walletStore.balanceOfStakingToken) }}
          </div>
          <div class="text-sm mt-2 font-medium" :class="color">
            ${{ format.tokenValue(walletStore.balanceOfStakingToken) }}
          </div>
        </div>
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg px-5 py-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm mb-2 text-gray-600 dark:text-gray-400 font-medium">{{ $t('module.staking') }}</div>
          <div class="text-xl font-bold text-main leading-tight">
            {{ format.formatToken(walletStore.stakingAmount) }}
          </div>
          <div class="text-sm mt-2 font-medium" :class="color">
            ${{ format.tokenValue(walletStore.stakingAmount) }}
          </div>
        </div>
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg px-5 py-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm mb-2 text-gray-600 dark:text-gray-400 font-medium">{{ $t('index.reward') }}</div>
          <div class="text-xl font-bold text-main leading-tight">
            {{ format.formatToken(walletStore.rewardAmount) }}
          </div>
          <div class="text-sm mt-2 font-medium" :class="color">
            ${{ format.tokenValue(walletStore.rewardAmount) }}
          </div>
        </div>
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg px-5 py-5 border border-gray-200 dark:border-gray-700">
          <div class="text-sm mb-2 text-gray-600 dark:text-gray-400 font-medium">{{ $t('index.unbonding') }}</div>
          <div class="text-xl font-bold text-main leading-tight">
            {{ format.formatToken(walletStore.unbondingAmount) }}
          </div>
          <div class="text-sm mt-2 font-medium" :class="color">
            ${{ format.tokenValue(walletStore.unbondingAmount) }}
          </div>
        </div>
      </div>

      <div v-if="walletStore.delegations.length > 0" class="px-6 pb-6 overflow-auto">
        <table class="table table-compact w-full table-zebra">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-4 py-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">{{ $t('account.validator') }}</th>
              <th class="px-4 py-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">{{ $t('account.delegations') }}</th>
              <th class="px-4 py-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">{{ $t('account.rewards') }}</th>
              <th class="px-4 py-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">{{ $t('staking.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in walletStore.delegations" :key="index" class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
              <td class="px-4 py-4">
                <RouterLink class="link link-primary no-underline hover:underline" :to="`/${chain}/staking/${item?.delegation?.validator_address}`">
                {{
                  format.validatorFromBech32(
                    item?.delegation?.validator_address
                  )
                }}
                </RouterLink>
              </td>
              <td class="px-4 py-4">{{ format.formatToken(item?.balance) }}</td>
              <td class="px-4 py-4">
                {{
                  format.formatTokens(
                    walletStore?.rewards?.rewards?.find(
                      (el) =>
                        el?.validator_address ===
                        item?.delegation?.validator_address
                    )?.reward)
                }}
              </td>
              <td class="px-4 py-4">
                <div class="flex gap-2">
                  <label for="delegate" class="btn !btn-xs !btn-primary btn-ghost rounded-sm transition-all duration-200"
                    @click="dialog.open('delegate', { validator_address: item.delegation.validator_address }, updateState)">
                    {{ $t('account.btn_delegate') }}
                  </label>
                  <label for="withdraw" class="btn !btn-xs !btn-primary btn-ghost rounded-sm transition-all duration-200"
                    @click="dialog.open('withdraw', { validator_address: item.delegation.validator_address }, updateState)">
                    {{ $t('index.btn_withdraw_reward') }}
                  </label>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="grid grid-cols-3 gap-4 px-6 pb-6 mt-4">
        <label for="PingTokenConvert" class="btn btn-primary text-white hover:scale-105 transition-transform duration-200">{{ $t('index.btn_swap') }}</label>
        <label for="send" class="btn !bg-yes !border-yes text-white hover:scale-105 transition-transform duration-200" @click="dialog.open('send', {}, updateState)">{{ $t('account.btn_send') }}</label>
        <label for="delegate" class="btn !bg-info !border-info text-white hover:scale-105 transition-transform duration-200"
          @click="dialog.open('delegate', {}, updateState)">{{ $t('account.btn_delegate') }}</label>
        <RouterLink to="/wallet/receive" class="btn !bg-info !border-info text-white hidden">{{ $t('index.receive') }}</RouterLink>
      </div>
      <Teleport to="body">
        <ping-token-convert :chain-name="blockchain?.current?.prettyName" :endpoint="blockchain?.endpoint?.address"
          :hd-path="walletStore?.connectedWallet?.hdPath"></ping-token-convert>
      </Teleport>
    </div>

    <div class="bg-base-100 rounded-lg mt-6 shadow-md">
      <div class="px-6 pt-6 pb-4 text-xl font-semibold text-main">
        {{ $t('index.app_versions') }}
      </div>
      <!-- Application Version -->
      <ArrayObjectElement :value="paramStore.appVersion?.items" :thead="false" />
      <div class="h-4"></div>
    </div>

    <div v-if="!store.coingeckoId" class="bg-base-100 rounded-lg mt-6 shadow-md">
      <div class="px-6 pt-6 pb-4 text-xl font-semibold text-main">
        {{ $t('index.node_info') }}
      </div>
      <ArrayObjectElement :value="paramStore.nodeVersion?.items" :thead="false" />      
      <div class="h-4"></div>
    </div>
  </div>
</template>

<route>
  {
    meta: {
      i18n: 'dashboard',
      order: 1,
    }
  }
</route>
