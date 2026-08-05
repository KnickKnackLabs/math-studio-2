<script lang="ts">
  import { onMount } from "svelte";

  import type { Dispatch } from "../core/commands";

  export let dispatch: Dispatch;

  let closeButton: HTMLButtonElement;
  let fullscreenActive = false;
  let fullscreenAvailable = false;

  onMount(() => {
    const previousFocus = document.activeElement;
    const syncFullscreen = () => fullscreenActive = document.fullscreenElement !== null;
    fullscreenAvailable = document.fullscreenEnabled;
    document.addEventListener("fullscreenchange", syncFullscreen);
    syncFullscreen();
    closeButton.focus();

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  });

  async function toggleFullscreen(): Promise<void> {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  }
</script>

<div class="help-overlay" aria-labelledby="help-title" role="dialog">
  <div class="help-panel">
    <header>
      <div>
        <span class="eyebrow">mim controls</span>
        <h1 id="help-title">Help</h1>
      </div>
      <button
        bind:this={closeButton}
        class="help-close"
        type="button"
        on:click={() => dispatch({ type: "close-help" })}
      >Close</button>
    </header>

    <dl>
      <div><dt><kbd>?</kbd></dt><dd>toggle this help</dd></div>
      <div><dt><kbd>Esc</kbd></dt><dd>close help, or clear the recorded motion</dd></div>
      <div><dt><kbd>h j k l</kbd></dt><dd>move the selected cell; hold two directions for diagonals</dd></div>
      <div><dt>pin cursor</dt><dd>move the lattice while keeping the cursor in place</dd></div>
      <div><dt><kbd>10l</kbd></dt><dd>move ten cells right</dd></div>
      <div><dt><kbd>arrows</kbd></dt><dd>move the selected cell; counts work here too</dd></div>
      <div><dt><kbd>s</kbd> … <kbd>e</kbd></dt><dd>record the movement sequence between start and end</dd></div>
      <div><dt><kbd>Space</kbd></dt><dd>replay the recorded movement sequence</dd></div>
      <div><dt><kbd>Shift Space</kbd></dt><dd>retrace the recorded sequence in reverse</dd></div>
      <div><dt><kbd>g</kbd></dt><dd>show greatest common divisors</dd></div>
      <div><dt><kbd>m</kbd></dt><dd>show least common multiples</dd></div>
      <div><dt>Field</dt><dd>choose a built-in value for every lattice cell</dd></div>
      <div><dt>Formula</dt><dd>compose x/y values and xi/yi indices with arithmetic, comparisons, and safe functions</dd></div>
      <div><dt>functions</dt><dd>abs, gcd, lcm, min, max, mod, prime, coprime, divides, divisors, valuation, remove, strip, if, xor</dd></div>
      <div><dt>Visual</dt><dd>choose magnitude, exact, banded, modulo, or prime-signature color</dd></div>
      <div><dt>Prime lens</dt><dd>remove all or a chosen number of powers before coloring</dd></div>
      <div><dt><kbd>+ −</kbd></dt><dd>zoom in and out</dd></div>
      <div><dt><kbd>wheel</kbd></dt><dd>zoom toward the pointer</dd></div>
      <div><dt><kbd>p</kbd></dt><dd>toggle prime results</dd></div>
      <div><dt><kbd>Shift P</kbd></dt><dd>toggle render performance</dd></div>
      <div><dt><kbd>[ ]</kbd></dt><dd>shorten or lengthen the performance window</dd></div>
      <div><dt>click</dt><dd>select a cell</dd></div>
      <div><dt>drag</dt><dd>pan the view</dd></div>
      <div><dt>X / Y axes</dt><dd>choose how grid indices map to mathematical values</dd></div>
      <div><dt>M / N</dt><dd>show the derived visible lattice dimensions</dd></div>
      <div><dt>Full screen</dt><dd>enter browser fullscreen; Escape exits</dd></div>
      <div><dt>Reset</dt><dd>restore the instrument defaults</dd></div>
    </dl>

    <div class="help-actions">
      <button
        disabled={!fullscreenAvailable}
        type="button"
        on:click={toggleFullscreen}
      >{fullscreenActive ? "Exit full screen" : "Enter full screen"}</button>
      <button
        type="button"
        on:click={() => dispatch({ type: "reset-defaults" })}
      >Reset instrument</button>
    </div>
  </div>
</div>
