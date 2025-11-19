<script lang="ts" setup>
import {
    useBaseStore,
    useBlockchain,
    useFormatter,
    useMintStore,
    useStakingStore,
    useTxDialog,
} from '@/stores';
import { computed } from '@vue/reactivity';
import { onMounted, ref } from 'vue';
import { Icon } from '@iconify/vue';
import type { Key, SlashingParam, Validator } from '@/types';
import { formatSeconds}  from '@/libs/utils'

const staking = useStakingStore();
const base = useBaseStore();
const format = useFormatter();
const dialog = useTxDialog();
const chainStore = useBlockchain();
const mintStore = useMintStore()

const cache = JSON.parse(localStorage.getItem('avatars') || '{}');
const avatars = ref(cache || {});
const latest = ref({} as Record<string, number>);
const yesterday = ref({} as Record<string, number>);
const tab = ref('active');
const unbondList = ref([] as Validator[]);
const slashing =ref({} as SlashingParam)

onMounted(() => {
    staking.fetchUnbondingValdiators().then((res) => {
        unbondList.value = res.concat(unbondList.value);
    });
    staking.fetchInacitveValdiators().then((res) => {
        unbondList.value = unbondList.value.concat(res);
    });
    chainStore.rpc.getSlashingParams().then(res => {
        slashing.value = res.params
    })
});

async function fetchChange() {
    let page = 0;

    let height = Number(base.latest?.block?.header?.height || 0);
    if (height > 14400) {
        height -= 14400;
    } else {
        height = 1;
    }
    // voting power in 24h ago
    while (page < staking.validators.length && height > 0) {
        await base.fetchValidatorByHeight(height, page).then((x) => {
            x.validators.forEach((v) => {
                yesterday.value[v.pub_key.key] = Number(v.voting_power);
            });
        });
        page += 100;
    }

    page = 0;
    // voting power for now
    while (page < staking.validators.length) {
        await base.fetchLatestValidators(page).then((x) => {
            x.validators.forEach((v) => {
                latest.value[v.pub_key.key] = Number(v.voting_power);
            });
        });
        page += 100;
    }
}

const changes = computed(() => {
    const changes = {} as Record<string, number>;
    Object.keys(latest.value).forEach((k) => {
        const l = latest.value[k] || 0;
        const y = yesterday.value[k] || 0;
        changes[k] = l - y;
    });
    return changes;
});

const change24 = (key: Key) => {
    const txt = key.key;
    // const n: number = latest.value[txt];
    // const o: number = yesterday.value[txt];
    // // console.log( txt, n, o)
    // return n > 0 && o > 0 ? n - o : 0;
    return changes.value[txt];
};

const change24Text = (key?: Key) => {
    if (!key) return '';
    const v = change24(key);
    return v && v !== 0 ? format.showChanges(v) : '';
};

const change24Color = (key?: Key) => {
    if (!key) return '';
    const v = change24(key);
    if (v > 0) return 'text-success';
    if (v < 0) return 'text-error';
};

const calculateRank = function (position: number) {
    let sum = 0;
    for (let i = 0; i < position; i++) {
        sum += Number(staking.validators[i]?.delegator_shares);
    }
    const percent = sum / staking.totalPower;

    switch (true) {
        case tab.value === 'active' && percent < 0.33:
            return 'error';
        case tab.value === 'active' && percent < 0.67:
            return 'warning';
        default:
            return 'primary';
    }
};

function isFeatured(endpoints: string[], who?: {website?: string, moniker: string }) {
    if(!endpoints || !who) return false
    return endpoints.findIndex(x => who.website && who.website?.substring(0, who.website?.lastIndexOf('.')).endsWith(x) || who?.moniker?.toLowerCase().search(x.toLowerCase()) > -1) > -1
}

const list = computed(() => {
    if (tab.value === 'active') {
        return staking.validators.map((x, i) => ({v: x, rank: calculateRank(i), logo: logo(x.description.identity)}));
    } else if (tab.value === 'featured') {
        const endpoint = chainStore.current?.endpoints?.rest?.map(x => x.provider)
        if(endpoint) {
            endpoint.push('ping')
            return staking.validators
                .filter(x => isFeatured(endpoint, x.description))
                .map((x, i) => ({v: x, rank: 'primary', logo: logo(x.description.identity)}));
        }
        return []        
    }
    return unbondList.value.map((x, i) => ({v: x, rank: 'primary', logo: logo(x.description.identity)}));
});

const fetchAvatar = (identity: string) => {
  // fetch avatar from keybase
  return new Promise<void>((resolve) => {
    staking
      .keybase(identity)
      .then((d) => {
        if (Array.isArray(d.them) && d.them.length > 0) {
          const uri = String(d.them[0]?.pictures?.primary?.url).replace(
            'https://s3.amazonaws.com/keybase_processed_uploads/',
            ''
          );

          avatars.value[identity] = uri;
          resolve();
        } else throw new Error(`failed to fetch avatar for ${identity}`);
      })
      .catch((error) => {
        // console.error(error); // uncomment this if you want the user to see which avatars failed to load.
        resolve();
      });
  });
};

const loadAvatar = (identity: string) => {
  // fetches avatar from keybase and stores it in localStorage
  fetchAvatar(identity).then(() => {
    localStorage.setItem('avatars', JSON.stringify(avatars.value));
  });
};

const loadAvatars = () => {
  // fetches all avatars from keybase and stores it in localStorage
  const promises = staking.validators.map((validator) => {
    const identity = validator.description?.identity;

    // Here we also check whether we haven't already fetched the avatar
    if (identity && !avatars.value[identity]) {
      return fetchAvatar(identity);
    } else {
      return Promise.resolve();
    }
  });

  Promise.all(promises).then(() =>
    localStorage.setItem('avatars', JSON.stringify(avatars.value))
  );
};

const logo = (identity?: string) => {
    if (!identity || !avatars.value[identity]) return '';
    const url = avatars.value[identity] || '';
    return url.startsWith('http')
        ? url
        : `https://s3.amazonaws.com/keybase_processed_uploads/${url}`;
};

fetchChange();
loadAvatars();
</script>
<template>
<div>
    <div class="bg-base-100 rounded-lg grid sm:grid-cols-1 md:grid-cols-4 p-6 gap-6 shadow-md mb-6">    
        <div class="flex">
            <span>
                <div class="relative w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center mr-3">
                    <Icon class="text-success" icon="mdi:trending-up" size="32" />
                    <div class="absolute top-0 left-0 bottom-0 right-0 opacity-20 bg-success"></div>
                </div>
            </span>
            <span>
                <div class="font-bold text-lg text-main">{{ format.percent(mintStore.inflation) }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">{{ $t('staking.inflation') }}</div>
            </span>
        </div>
        <div class="flex">
            <span>
                <div class="relative w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center mr-3">
                    <Icon class="text-primary" icon="mdi:lock-open-outline" size="32" />
                    <div class="absolute top-0 left-0 bottom-0 right-0 opacity-20 bg-primary"></div>
                </div>
            </span>
            <span>
                <div class="font-bold text-lg text-main">{{ formatSeconds(staking.params?.unbonding_time) }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400">{{ $t('staking.unbonding_time') }}</div>
            </span>
        </div> 
        <div class="flex">
            <span>
                <div class="relative w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center mr-3">
                    <Icon class="text-error" icon="mdi:alert-octagon-outline" size="32" />
                    <div class="absolute top-0 left-0 bottom-0 right-0 opacity-20 bg-error"></div>
                </div>
            </span>
            <span>
            <div class="font-bold text-lg text-main">{{ format.percent(slashing.slash_fraction_double_sign) }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">{{ $t('staking.double_sign_slashing') }}</div>
            </span>
        </div> 
        <div class="flex">
            <span>
                <div class="relative w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center mr-3">
                    <Icon class="text-error" icon="mdi:pause" size="32" />
                    <div class="absolute top-0 left-0 bottom-0 right-0 opacity-20 bg-error"></div>
                </div>
            </span>
            <span>
            <div class="font-bold text-lg text-main">{{ format.percent(slashing.slash_fraction_downtime) }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">{{ $t('staking.downtime_slashing') }}</div>
            </span>
        </div>  
    </div>

    <div>
        <div class="flex items-center justify-between py-3 mb-4">
            <div class="tabs tabs-boxed bg-transparent">
                <a
                    class="tab text-gray-400 uppercase transition-all duration-200 hover:text-primary"
                    :class="{ 'tab-active': tab === 'featured' }"
                    @click="tab = 'featured'"
                    >{{ $t('staking.popular') }}</a
                >
                <a
                    class="tab text-gray-400 uppercase transition-all duration-200 hover:text-primary"
                    :class="{ 'tab-active': tab === 'active' }"
                    @click="tab = 'active'"
                    >{{ $t('staking.active') }}</a
                >
                <a
                    class="tab text-gray-400 uppercase transition-all duration-200 hover:text-primary"
                    :class="{ 'tab-active': tab === 'inactive' }"
                    @click="tab = 'inactive'"
                    >{{ $t('staking.inactive') }}</a
                >
            </div>

            <div class="text-lg font-semibold text-main">
                {{ list.length }}/{{ staking.params.max_validators }}
            </div>
        </div>

        <div class="bg-base-100 px-6 pt-4 pb-6 rounded-lg shadow-md">
            <div class="overflow-x-auto">
                <table class="table staking-table w-full">
                    <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                            <th
                                scope="col"
                                class="uppercase text-xs font-semibold text-gray-600 dark:text-gray-400"
                                style="width: 3rem; position: relative"
                            >
                            {{ $t('staking.rank') }}    
                            </th>
                            <th scope="col" class="uppercase text-xs font-semibold text-gray-600 dark:text-gray-400">{{ $t('staking.validator') }}</th>
                            <th scope="col" class="text-right uppercase text-xs font-semibold text-gray-600 dark:text-gray-400">{{ $t('staking.voting_power') }}</th>
                            <th scope="col" class="text-right uppercase text-xs font-semibold text-gray-600 dark:text-gray-400">{{ $t('staking.24h_changes') }}</th>
                            <th scope="col" class="text-right uppercase text-xs font-semibold text-gray-600 dark:text-gray-400">{{ $t('staking.commission') }}</th>
                            <th scope="col" class="text-center uppercase text-xs font-semibold text-gray-600 dark:text-gray-400">{{ $t('staking.actions') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="({v, rank, logo}, i) in list"
                            :key="v.operator_address"
                            class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 border-b border-gray-100 dark:border-gray-700"
                        >
                            <!-- 👉 rank -->
                            <td class="py-4">
                                <div
                                    class="text-xs truncate relative px-3 py-2 rounded-full w-fit font-medium"
                                    :class="`text-${rank}`"
                                >
                                    <span
                                        class="inset-x-0 inset-y-0 opacity-10 absolute rounded-full"
                                        :class="`bg-${rank}`"
                                    ></span>
                                    {{ i + 1 }}
                                </div>
                            </td>
                            <!-- 👉 Validator -->
                            <td class="py-4">
                                <div
                                    class="flex items-center overflow-hidden"
                                    style="max-width: 300px"
                                >
                                    <div
                                        class="avatar mr-4 relative w-10 h-10 rounded-full"
                                    >
                                        <div
                                            class="w-10 h-10 rounded-full bg-gray-400 absolute opacity-10"
                                        ></div>
                                        <div class="w-10 h-10 rounded-full">
                                            <img
                                                v-if="logo"
                                                :src="logo"
                                                class="object-contain"
                                                @error="
                                                    (e) => {
                                                        const identity = v.description?.identity;
                                                        if (identity) loadAvatar(identity);
                                                    }
                                                "
                                            />
                                            <Icon
                                                v-else
                                                class="text-3xl"
                                                :icon="`mdi-help-circle-outline`"
                                            />
                                            
                                        </div>
                                    </div>

                                    <div class="flex flex-col">
                                        <span class="text-sm text-primary dark:invert whitespace-nowrap overflow-hidden font-medium">
                                            <RouterLink
                                                :to="{
                                                    name: 'chain-staking-validator',
                                                    params: {
                                                        validator:
                                                            v.operator_address,
                                                    },
                                                }"
                                                class="hover:underline"
                                            >
                                                {{ v.description?.moniker }}
                                            </RouterLink>
                                        </span>
                                        <span class="text-xs text-gray-500 dark:text-gray-400">{{
                                            v.description?.website ||
                                            v.description?.identity ||
                                            '-'
                                        }}</span>
                                    </div>
                                </div>
                            </td>

                            <!-- 👉 Voting Power -->
                            <td class="text-right py-4">
                                <div class="flex flex-col">
                                    <h6 class="text-sm font-semibold whitespace-nowrap text-main">
                                        {{
                                            format.formatToken(
                                                {
                                                    amount: parseInt(
                                                        v.tokens
                                                    ).toString(),
                                                    denom: staking.params
                                                        .bond_denom,
                                                },
                                                true,
                                                '0,0'
                                            )
                                        }}
                                    </h6>
                                    <span class="text-xs text-gray-500 dark:text-gray-400">{{
                                        format.calculatePercent(
                                            v.delegator_shares,
                                            staking.totalPower
                                        )
                                    }}</span>
                                </div>
                            </td>
                            <!-- 👉 24h Changes -->
                            <td
                                class="text-right text-sm font-medium py-4"
                                :class="change24Color(v.consensus_pubkey)"
                            >
                                {{ change24Text(v.consensus_pubkey) }}
                            </td>
                            <!-- 👉 commission -->
                            <td class="text-right text-sm py-4">
                                {{
                                    format.formatCommissionRate(
                                        v.commission?.commission_rates?.rate
                                    )
                                }}
                            </td>
                            <!-- 👉 Action -->
                            <td class="text-center py-4">
                                <div
                                    v-if="v.jailed"
                                    class="badge badge-error gap-2 text-white px-3 py-2"
                                >
                                {{ $t('staking.jailed') }}
                                </div>
                                <label
                                    v-else
                                    for="delegate"
                                    class="btn btn-xs btn-primary rounded-sm capitalize hover:scale-105 transition-transform duration-200"
                                    @click="
                                        dialog.open('delegate', {
                                            validator_address:
                                                v.operator_address,
                                        })
                                    "
                                    >{{ $t('account.btn_delegate') }}</label
                                >
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="divider"></div>
            <div class="flex flex-row items-center flex-wrap gap-2">
                <div
                    class="text-xs truncate relative py-2 px-4 rounded-lg w-fit text-error font-medium"
                >
                    <span
                        class="inset-x-0 inset-y-0 opacity-10 absolute bg-error rounded-lg"
                    ></span>
                    {{ $t('staking.top') }} 33%
                </div>
                <div
                    class="text-xs truncate relative py-2 px-4 rounded-lg w-fit text-warning font-medium"
                >
                    <span
                        class="inset-x-0 inset-y-0 opacity-10 absolute bg-warning rounded-lg"
                    ></span>
                    {{ $t('staking.top') }} 67%
                </div>
                <div class="text-xs hidden md:!block pl-2 text-gray-600 dark:text-gray-400">
                    {{ $t('staking.description') }}
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<route>
  {
    meta: {
      i18n: 'staking',
      order: 3
    }
  }
</route>

<style>
.staking-table.table :where(th, td) {
    padding: 12px 8px;
    background: transparent;
}
</style>
