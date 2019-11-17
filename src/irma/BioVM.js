/**
 * Extension of VM class. Adds biological related commands into "line" language like
 * "join", "split", "see", "step" and so on. 
 * 
 * @author flatline
 */
const VM = require('VM');

class BioVM extends VM {
    /**
     * Runs VM for all organisms Config.codeTimesPerRun times
     * @override
     */
    run() {
        const times            = Config.codeTimesPerRun;
        const lines            = Config.codeLinesPerIteration;
        const stepEnergyCoef   = Config.energyStepCoef;
        const world            = this.world;
        const mutationPeriod   = Config.orgMutationPeriod;
        const orgsAndMols      = this.orgsAndMols;
        const orgsAndMolsRef   = orgsAndMols.ref();
        const orgs             = this.orgs;
        const orgsRef          = orgs.ref();
        //
        // Loop X times through population
        //
        for (let time = 0; time < times; time++) {
            //
            // Loop through population
            //
            let o = orgs.items;
            while (--o > -1) {
                const org  = orgsRef[o];
                let   code = org.code;
                let   ax   = org.ax;
                let   bx   = org.bx;
                let   line = org.line;
                //
                // Resets value of 'say' command
                //
                if (org.freq) {org.freq = this._freq[org.freq] = 0}
                //
                // Loop through few lines in one organism to
                // support pseudo multi threading
                //
                for (let l = 0; l < lines; l++) {
                    const cmd = code[line];

                    switch (cmd) {
                        case CODE_CMD_OFFS: {    // toggle
                            ++line;
                            const tmp = ax;
                            ax = bx;
                            bx = tmp;
                            continue;
                        }

                        case CODE_CMD_OFFS + 1:  // shift
                            ++line;
                            org.ax = ax;
                            org.bx = bx;
                            org.shift();
                            ax = org.ax;
                            bx = org.bx;
                            continue;

                        case CODE_CMD_OFFS + 2:  // eq
                            ++line;
                            ax = bx;
                            continue;

                        case CODE_CMD_OFFS + 3:  // pop
                            ++line;
                            ax = org.pop();
                            continue;

                        case CODE_CMD_OFFS + 4:  // push
                            ++line;
                            org.push(ax);
                            continue;

                        case CODE_CMD_OFFS + 5:  // nop
                            ++line;
                            continue;

                        case CODE_CMD_OFFS + 6:  // add
                            ++line;
                            ax += bx;
                            if (!fin(ax)) {ax = MAX}
                            continue;

                        case CODE_CMD_OFFS + 7:  // sub
                            ++line;
                            ax -= bx;
                            if (!fin(ax)) {ax = MIN}
                            continue;

                        case CODE_CMD_OFFS + 8:  // mul
                            ++line;
                            ax *= bx;
                            if (!fin(ax)) {ax = MAX}
                            continue;

                        case CODE_CMD_OFFS + 9:  // div
                            ++line;
                            ax = round(ax / bx);
                            if (!fin(ax)) {ax = MIN}
                            continue;

                        case CODE_CMD_OFFS + 10: // inc
                            ++line;
                            ax++;
                            if (!fin(ax)) {ax = MAX}
                            continue;

                        case CODE_CMD_OFFS + 11:  // dec
                            ++line;
                            ax--;
                            if (!fin(ax)) {ax = MIN}
                            continue;

                        case CODE_CMD_OFFS + 12:  // rshift
                            ++line;
                            ax >>= 1;
                            continue;

                        case CODE_CMD_OFFS + 13:  // lshift
                            ++line;
                            ax <<= 1;
                            continue;

                        case CODE_CMD_OFFS + 14:  // rand
                            ++line;
                            ax = ax < 0 ? rand(CODE_MAX_RAND * 2) - CODE_MAX_RAND : rand(ax);
                            continue;

                        case CODE_CMD_OFFS + 15:  // ifp
                            line = ax > 0 ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 16:  // ifn
                            line = ax < 0 ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 17:  // ifz
                            line = ax === 0 ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 18:  // ifg
                            line = ax > bx ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 19:  // ifl
                            line = ax < bx ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 20:  // ife
                            line = ax === bx ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 21:  // ifne
                            line = ax !== bx ? line + 1 : org.offs[line];
                            continue;

                        case CODE_CMD_OFFS + 22: {// loop
                            const loops = org.loops;
                            //
                            // previous line was "end", so this is next iteration cicle
                            //
                            if (!org.isLoop) {loops[line] = -1}
                            org.isLoop = false;
                            if (loops[line] < 0 && org.offs[line] > line + 1) {
                                loops[line] = ax;
                            }
                            if (--loops[line] < 0) {
                                line = org.offs[line];
                                continue;
                            }
                            ++line;
                            continue;
                        }

                        case CODE_CMD_OFFS + 23: {// call
                            if (org.fCount === 0) {++line; continue}
                            let index = org.stackIndex;
                            if (index >= CODE_STACK_SIZE * 3) {index = -1}
                            const func     = abs(ax) % org.fCount;
                            const stack    = org.stack;
                            const newLine  = org.funcs[func];
                            if (org.offs[newLine - 1] === newLine) {++line; continue}
                            stack[++index] = line + 1;
                            stack[++index] = ax;
                            stack[++index] = bx;
                            line = newLine;
                            org.stackIndex = index;
                            continue;
                        }

                        case CODE_CMD_OFFS + 24:   // func
                            line = org.offs[line];
                            if (line === 0 && org.stackIndex >= 0) {
                                const stack = org.stack;
                                bx   = stack[2];
                                ax   = stack[1];
                                line = stack[0];
                                org.stackIndex = -1;
                            }
                            continue;

                        case CODE_CMD_OFFS + 25: {// ret
                            const stack = org.stack;
                            let index = org.stackIndex;
                            if (index < 0) {line = 0; continue}
                            bx   = stack[index--];
                            ax   = stack[index--];
                            line = stack[index--];
                            org.stackIndex = index;
                            continue;
                        }

                        case CODE_CMD_OFFS + 26:  // end
                            switch (code[org.offs[line]]) {
                                case CODE_CMD_OFFS + 22: // loop
                                    line = org.offs[line];
                                    org.isLoop = true;
                                    break;
                                case CODE_CMD_OFFS + 24: // func
                                    const stack = org.stack;
                                    let index = org.stackIndex;
                                    if (index < 0) {break}
                                    bx   = stack[index--];
                                    ax   = stack[index--];
                                    line = stack[index--];
                                    org.stackIndex = index;
                                    break;
                                default:
                                    ++line;
                                    break;
                            }
                            continue;

                        case CODE_CMD_OFFS + 27:  // retax
                            ++line;
                            ax = org.ret;
                            continue;

                        case CODE_CMD_OFFS + 28:  // axret
                            ++line;
                            org.ret = ax;
                            continue;

                        case CODE_CMD_OFFS + 29:  // and
                            ++line;
                            ax &= bx;
                            continue;

                        case CODE_CMD_OFFS + 30:  // or
                            ++line;
                            ax |= bx;
                            continue;

                        case CODE_CMD_OFFS + 31:  // xor
                            ++line;
                            ax ^= bx;
                            continue;

                        case CODE_CMD_OFFS + 32:  // not
                            ++line;
                            ax = ~ax;
                            continue;

                        case CODE_CMD_OFFS + 33: {// join
                            ++line;
                            const offset = org.offset + DIR[abs(ax) % 8];
                            const dot    = world.getOrgIdx(offset);
                            if (dot < 0) {org.ret = RET_ERR; continue}
                            const nearOrg = orgsAndMolsRef[dot];
                            if (nearOrg.code.length + code.length > ORG_CODE_MAX_SIZE) {org.ret = RET_ERR; continue}
                            org.code = code = code.push(nearOrg.code);
                            //
                            // Important: joining new commands into the script may break it, because it's
                            // offsets, stack and context may be invalid. Generally, we have to preprocess
                            // it after join. But this process resets stack and current running script line
                            // to zero line and script start running from the beginning. To fix this we 
                            // add any joined command to the end of script and skip preprocessing. So, next
                            // line should not be uncommented
                            // org.preprocess();
                            //
                            org.energy += (nearOrg.code.length * Config.energyMultiplier);
                            this._removeOrg(nearOrg);
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 34: {// split
                            ++line;
                            if (orgsAndMols.full) {org.ret = RET_ERR; continue}
                            const offset  = org.offset + DIR[abs(org.ret) % 8];
                            if (offset < 0 || offset > MAX_OFFS) {org.ret = RET_ERR; continue}
                            const dot     = world.getOrgIdx(offset);
                            if (dot > -1) {org.ret = RET_ERR; continue} // organism on the way
                            if (ax < 0 || ax > code.length || bx <= ax) {org.ret = RET_ERR; continue}
                            const newCode = code.subarray(ax, bx);
                            org.code = code = code.splice(ax, bx - ax);
                            if (newCode.length < 1 || org.cur() === IS_ORG_ID && orgs.full) {org.ret = RET_ERR; continue}
                            //
                            // TODO: This is bad idea to hardcode IS_ORG_ID into organism. Because this mechanism
                            // TODO: should be esupported by organism from parent to child
                            //
                            const clone   = this._createOrg(offset, org, newCode, org.cur() === IS_ORG_ID);
                            this._db && this._db.put(clone, org);
                            const energy = clone.code.length * Config.energyMultiplier;
                            clone.energy = energy;
                            if (Config.codeMutateEveryClone > 0 && rand(Config.codeMutateEveryClone) === 0 && clone.isOrg) {
                                Mutations.mutate(clone);
                            }
                            if (code.length < 1) {this._removeOrg(org); break}
                            org.energy  -= energy;
                            //
                            // Important: after split, sequence of commands have been changed and it may break
                            // entire script. Generally, we have to preprocess new script to fix all offsets
                            // and run t again from the beginning. Preprocessing resets the context and stack.
                            // So nothing will be running after split command. To fix this, we just assume that 
                            // we split commands from tail, which don't affect main (replicator) part. Next line
                            // should be commented
                            // org.preprocess();
                            // line = 0;
                            //
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 35: {// step
                            ++line;
                            org.energy -= Math.floor(code.length * stepEnergyCoef);
                            let offset = org.offset + DIR[abs(ax) % 8];
                            if (offset < -1) {offset = LINE_OFFS + org.offset}
                            else if (offset > MAX_OFFS) {offset = org.offset - LINE_OFFS}
                            if (world.getOrgIdx(offset) > -1) {org.ret = RET_ERR; continue}
                            world.moveOrg(org, offset);
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 36:  // find
                            ++line;
                            if (bx < 0) {
                                const ret   = org.ret;
                                const index = code.findIndex((c, i) => i >= ret && ax === c);
                                if (index === -1) {
                                    org.ret = RET_ERR;
                                } else {
                                    org.find0 = org.find1 = ax = index;
                                    org.ret = RET_OK;
                                }
                            } else {
                                if (bx > ax || ax > code.length || bx > code.length) {org.ret = RET_ERR; continue}
                                const len2 = bx - ax;
                                const len1 = code.length - (len2 + 1);
                                let   ret  = RET_ERR;
                                let   j;
                                loop: for (let i = org.ret < 0 ? 0 : org.ret; i < len1; i++) {
                                    for (j = ax; j <= bx; j++) {
                                        if (code[i + j - ax] !== code[j]) {continue loop}
                                    }
                                    org.find0 = ax = i;
                                    org.find1 = i + len2;
                                    ret = RET_OK;
                                    break;
                                }
                                org.ret = ret;
                            }
                            continue;

                        case CODE_CMD_OFFS + 37: {// move
                            ++line;
                            const find0    = org.find0;
                            const find1    = org.find1;
                            if (find1 < find0) {org.ret = RET_ERR; continue}
                            const moveCode = code.slice(find0, find1 + 1);
                            if (moveCode.length < 1) {org.ret = RET_ERR; continue}
                            const newAx    = ax < 0 ? 0 : (ax > code.length ? code.length : ax);
                            const len      = find1 - find0 + 1;
                            const offs     = newAx > find1 ? newAx - len : (newAx < find0 ? newAx : find0);
                            if (find0 === offs) {org.ret = RET_OK; continue}
                            code = code.splice(find0, len);
                            org.code = code = code.splice(offs, 0, moveCode);
                            //
                            // Important: moving new commands insie the script may break it, because it's
                            // offsets, stack and context may be invalid. Generally, we have to preprocess
                            // it after move. But this process resets stack and current running script line
                            // to zero line and script start running from the beginning. To fix this we 
                            // just assume that moving command doesn't belong to main (replicator) script
                            // part and skip preprocessing. So, next line should not be uncommented
                            // org.preprocess();
                            // line = 0;
                            //
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 38:  // see
                            ++line;
                            const offset = org.offset + ax;
                            if (offset < 0 || offset > MAX_OFFS) {ax = 0; continue}
                            const dot = world.getOrgIdx(offset);
                            ax = (dot < 0 ? 0 : orgsAndMolsRef[dot].color || Config.molColor);
                            continue;

                        case CODE_CMD_OFFS + 39: {// say
                            ++line;
                            const freq = abs(bx) % Config.worldFrequency;
                            this._freq[freq] = ax;
                            org.freq = freq;
                            continue;
                        }

                        case CODE_CMD_OFFS + 40:  // listen
                            ++line;
                            ax = this._freq[abs(bx) % Config.worldFrequency];
                            continue;

                        case CODE_CMD_OFFS + 41: {// nread
                            ++line;
                            const offset = org.offset + DIR[abs(ax) % 8];
                            const dot    = world.getOrgIdx(offset);
                            if (dot < 0) {org.ret = RET_ERR; continue}
                            const nearOrg = orgsAndMolsRef[dot];
                            ax = nearOrg.code[bx] || 0;
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 42: {// nsplit
                            ++line;
                            if (org.ret !== 1) {org.ret = RET_ERR; continue}
                            if (orgsAndMols.full) {org.ret = RET_ERR; continue}
                            const offset  = org.offset + DIR[abs(ax) % 8];
                            const dOffset = org.offset + DIR[abs(org.ret) % 8];
                            if (offset === dOffset) {org.ret = RET_ERR; continue}
                            const dot     = world.getOrgIdx(offset);
                            if (dot < 0) {org.ret = RET_ERR; continue}
                            const dDot    = world.getOrgIdx(dOffset);
                            if (dDot > -1) {org.ret = RET_ERR; continue}
                            const nearOrg = orgsAndMolsRef[dot];
                            const newCode = nearOrg.code.subarray(0, bx);
                            nearOrg.code  = nearOrg.code.splice(0, bx);
                            if (newCode.length < 1) {org.ret = RET_ERR; continue}
                            const cutOrg  = this._createOrg(dOffset, nearOrg, newCode);
                            this._db && this._db.put(cutOrg, nearOrg);
                            if (nearOrg.code.length < 1) {this._removeOrg(nearOrg)}
                            const energy = newCode.length * Config.energyMultiplier;
                            nearOrg.energy -= energy;
                            cutOrg.energy   = energy;
                            if (code.length < 1) {this._removeOrg(org); break}
                            org.ret = RET_OK;
                            continue;
                        }

                        case CODE_CMD_OFFS + 43: {// get
                            ++line;
                            if (org.ret !== 1 || org.packet) {org.ret = RET_ERR; continue}
                            const dot = world.getOrgIdx(org.offset + DIR[abs(ax) % 8]);
                            if (dot < 0) {org.ret = RET_ERR; continue}
                            this._removeOrg(org.packet = orgsAndMolsRef[dot]);
                            continue;
                        }

                        case CODE_CMD_OFFS + 44: {// put
                            ++line;
                            if (!org.packet) {org.ret = RET_ERR; continue}
                            if (orgsAndMols.full) {org.ret = RET_ERR; continue}
                            const offset = org.offset + DIR[abs(ax) % 8];
                            const dot    = world.getOrgIdx(offset);
                            if (dot > -1 || offset < 0 || offset > MAX_OFFS) {org.ret = RET_ERR; continue}
                            this._createOrg(offset, org.packet.isOrg ? org.packet : null, org.packet.code);
                            this._db && this._db.put(org.packet);
                            org.packet = null;
                            continue;
                        }

                        case CODE_CMD_OFFS + 45:  // offs
                            ++line;
                            ax = org.offset;
                            continue;

                        case CODE_CMD_OFFS + 46:  // age
                            ++line;
                            ax = org.age;
                            continue;

                        case CODE_CMD_OFFS + 47:  // line
                            ax = line++;
                            continue;

                        case CODE_CMD_OFFS + 48:  // len
                            line++;
                            ax = code.length;
                            continue;

                        case CODE_CMD_OFFS + 49:  // color
                            line++;
                            const newAx = abs(ax);
                            org.color   = (newAx < ORG_MIN_COLOR ? ORG_MIN_COLOR : newAx) % 0xffffff;
                            continue;
                    }
                    //
                    // This is constant value
                    //
                    if (cmd < CODE_CMD_OFFS && cmd > -CODE_CMD_OFFS) {ax = cmd; ++line; continue}
                    //
                    // We are on the last code line. Have to jump to the first
                    //
                    if (line >= code.length) {
                        if (org.stackIndex >= 0) {
                            const stack = org.stack;
                            bx   = stack[2];
                            ax   = stack[1];
                            line = stack[0];
                            org.stackIndex = -1;
                        } else {
                            line = 0;
                        }
                    }
                }
                org.line = line;
                org.ax   = ax;
                org.bx   = bx;
                //
                // Organism age related updates
                //
                const age = org.age;
                if (age % org.period === 0 && mutationPeriod > 0) {Mutations.mutate(org)}
                if (org.energy < 0 || age > Config.orgMaxAge) {
                    this._removeOrg(org);
                    this._createOrg(org.offset, null, org.code);
                }

                org.age++
                org.energy--;
                this._i += lines;
            }
            //
            // Plugins
            //
            for (let p = 0, pl = this.plugins.length; p < pl; p++) {this.plugins[p].run(this._iteration)}
            this._iteration++;
        }
        //
        // Updates status line at the top of screen
        //
        const ts = Date.now();
        if (ts - this._ts > 1000) {
            const orgAmount = this.orgs.items;
            world.title(`inps:${round(((this._i / orgAmount) / (((ts - this._ts) || 1)) * 1000))} orgs:${orgAmount} gen:${this.population}`);
            this._ts = ts;
            this._i  = 0;

            if (orgs.items < 1) {this._createOrgs()}
        }
    }
}

module.exports = BioVM;