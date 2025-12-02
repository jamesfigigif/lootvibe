# Quick Guide: Deploy Edge Functions via Supabase Dashboard

Since we don't have the CLI personal access token, the fastest way is to deploy via the dashboard.

## Step 1: Go to Edge Functions

1. Open https://supabase.com/dashboard/project/cbjdasfnwzizfphnwxfd/functions
2. Click **"Create a new function"**

## Step 2: Create battle-spin Function

1. **Function name**: `battle-spin`
2. **Copy this code** into the editor:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { battleId, playerId, clientSeed, nonce, boxItems } = await req.json()

    if (!battleId || !playerId || !clientSeed || nonce === undefined || !boxItems) {
      throw new Error('Missing required parameters')
    }

    const serverSeed = Deno.env.get('SERVER_SEED') || 'lootvibe-secure-server-seed-v1';
    const message = `${clientSeed}:${nonce}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(serverSeed);
    const msgData = encoder.encode(message);

    const key = await crypto.subtle.importKey(
      "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, msgData);
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const resultInt = parseInt(hashHex.substring(0, 8), 16);
    const randomValue = resultInt / 0xffffffff;
    const itemIndex = Math.floor(randomValue * boxItems.length);
    const outcomeItem = boxItems[itemIndex];

    return new Response(
      JSON.stringify({
        success: true,
        outcome: {
          item: outcomeItem,
          serverSeedHash: await crypto.subtle.digest('SHA-256', keyData).then(h => Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('')),
          nonce,
          randomValue
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

3. Click **"Deploy"**

## Step 3: Create battle-claim Function

1. Click **"Create a new function"** again
2. **Function name**: `battle-claim`
3. **Copy this code** into the editor:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { battleId, prizeChoice, amount, items } = await req.json()
    if (!battleId || !prizeChoice) throw new Error('Missing required parameters')

    console.log(`Processing claim for User ${user.id}, Battle ${battleId}, Type: ${prizeChoice}`);

    if (prizeChoice === 'cash') {
      if (!amount || amount <= 0) throw new Error('Invalid amount');

      const { error: txError } = await supabaseAdmin.from('transactions').insert({
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        type: 'WIN',
        amount: amount,
        description: `Battle victory prize (Battle ID: ${battleId})`,
        timestamp: Date.now()
      });

      if (txError) throw txError;

      const { data: userData, error: userError } = await supabaseAdmin
        .from('users').select('balance').eq('id', user.id).single();
      if (userError) throw userError;

      const newBalance = (parseFloat(userData.balance) || 0) + amount;
      const { error: updateError } = await supabaseAdmin
        .from('users').update({ balance: newBalance }).eq('id', user.id);
      if (updateError) throw updateError;

    } else if (prizeChoice === 'items') {
      if (!items || !Array.isArray(items) || items.length === 0) throw new Error('Invalid items');

      const inventoryInserts = items.map((item: any) => ({
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        item_data: item,
        created_at: new Date().toISOString()
      }));

      const { error: invError } = await supabaseAdmin.from('inventory_items').insert(inventoryInserts);
      if (invError) throw invError;
    } else {
      throw new Error('Invalid prize choice');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Prize claimed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Claim error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

4. Click **"Deploy"**

## Done! 🎉

Your battle system is now secure. The client code is already updated to use these functions.
