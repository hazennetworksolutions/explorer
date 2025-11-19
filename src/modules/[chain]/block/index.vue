<script lang="ts" setup>
import { computed, ref } from '@vue/reactivity';
import { useBaseStore, useFormatter } from '@/stores';
const props = defineProps(['chain']);

const tab = ref('blocks');

const base = useBaseStore()

const format = useFormatter();

const list = computed(() => {
    // const recents = base.recents
    // return recents.sort((a, b) => (Number(b.block.header.height) - Number(a.block.header.height)))
    return base.recents
})
</script>
<template>
    <div>
        <!-- Better spacing mb-6 -->
        <div class="tabs tabs-boxed bg-transparent mb-6">
            <a class="tab text-gray-400 uppercase transition-all duration-200 hover:text-primary" :class="{ 'tab-active': tab === 'blocks' }"
                @click="tab = 'blocks'">{{ $t('block.recent') }}</a>
            <RouterLink class="tab text-gray-400 uppercase transition-all duration-200 hover:text-primary" 
                :to="`/${chain}/block/${Number(base.latest?.block?.header.height||0) + 10000}`"
                >{{ $t('block.future') }}</RouterLink>
            <a class="tab text-gray-400 uppercase transition-all duration-200 hover:text-primary" :class="{ 'tab-active': tab === 'transactions' }"
                @click="tab = 'transactions'">{{ $t('account.transactions') }}</a>
        </div>

        <!-- Enhanced grid cards with hover effects -->
        <div v-show="tab === 'blocks'" class="grid xl:!grid-cols-6 md:!grid-cols-4 grid-cols-1 gap-6">

            <RouterLink v-for="item in list"
                class="flex flex-col justify-between rounded-lg p-6 shadow-md bg-base-100 hover:shadow-lg hover:scale-105 transition-all duration-200 border border-gray-100 dark:border-gray-700"
                :to="`/${chain}/block/${item.block.header.height}`">
                <div class="flex justify-between">
                    <!-- Better typography -->
                    <h3 class="text-lg font-bold sm:!text-xl leading-tight text-main">
                        {{ item.block.header.height }}
                    </h3>
                    <span class="rounded text-xs whitespace-nowrap font-medium text-green-600 px-2 py-1 bg-green-50 dark:bg-green-900/20">
                        {{ format.toDay(item.block?.header?.time, 'from') }}
                    </span>
                </div>
                <div class="flex justify-between tooltip" data-tip="Block Proposor">
                    <div class="mt-3 hidden text-sm sm:!block truncate text-gray-600 dark:text-gray-400">
                        <span>{{ format.validator(item.block?.header?.proposer_address) }}</span>
                    </div>
                    <span class="text-right mt-2 whitespace-nowrap text-sm font-medium"> {{ item.block?.data?.txs.length }} txs </span>
                </div>
            </RouterLink>
        </div>

        <!-- Enhanced table with better styling -->
        <div v-show="tab === 'transactions'" class="bg-base-100 rounded-lg overflow-x-auto shadow-md">
            <table class="table w-full table-compact">
                <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr>
                        <th class="px-4 py-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">{{ $t('account.height') }}</th>
                        <th class="px-4 py-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">{{ $t('account.hash') }}</th>
                        <th class="px-4 py-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">{{ $t('account.messages') }}</th>
                        <th class="px-4 py-4 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">{{ $t('block.fees') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in base.txsInRecents" :index="index" class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 border-b border-gray-100 dark:border-gray-800">
                        <td class="text-sm text-primary px-4 py-4">
                            <RouterLink :to="`/${props.chain}/block/${item.height}`" class="hover:underline">{{ item.height }}</RouterLink>
                        </td>
                        <td class="truncate text-primary px-4 py-4" width="50%">
                            <RouterLink :to="`/${props.chain}/tx/${item.hash}`" class="hover:underline">{{
                                item.hash
                            }}</RouterLink>
                        </td>
                        <td class="px-4 py-4 text-sm">{{ format.messages(item.tx.body.messages) }}</td>
                        <td class="px-4 py-4 text-sm">{{ format.formatTokens(item.tx.authInfo.fee?.amount) }}</td>
                    </tr>
                </tbody>
            </table>
            <!-- Enhanced info alert -->
            <div class="p-6">
                <div class="alert relative bg-transparent rounded-lg">
                    <div class="alert absolute inset-x-0 inset-y-0 w-full h-full bg-info opacity-10 rounded-lg"></div>
                    <div class="text-info flex gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                            class="stroke-current flex-shrink-0 w-6 h-6">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>{{ $t('block.only_tx') }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<route>
    {
      meta: {
        i18n: 'blocks',
        order: 5
      }
    }
</route>
