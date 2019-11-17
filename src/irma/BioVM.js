/**
 * Extension of VM class. Adds biologically related commands into "line" language like
 * "join", "split", "see", "step" and so on. 
 * 
 * @author flatline
 */
const VM = require('VM');

class BioVM extends VM {
    /**
     * Runs specified command, which is not a part of standart commands
     * like "add", "inc", "mul", "func", "ret", "end", "ifxx", ...
     * @param {Organism} org Current organism
     * @param {Number} cmd Command to run
     * @override
     */
    runCmd(org, cmd) {
        switch (cmd) {
            case CODE_CMD_OFFS + 33: {// join
                ++line;
                const offset = org.offset + DIR[abs(ax) % 8];
                const dot    = this.world.getOrgIdx(offset);
                if (dot < 0) {org.ret = RET_ERR; continue}
                const nearOrg = this.orgsAndMolsRef[dot];
                if (nearOrg.code.length + org.code.length > ORG_CODE_MAX_SIZE) {org.ret = RET_ERR; continue}
                org.code = org.code.push(nearOrg.code);
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
                if (this.orgsAndMols.full) {org.ret = RET_ERR; continue}
                const offset  = org.offset + DIR[abs(org.ret) % 8];
                if (offset < 0 || offset > MAX_OFFS) {org.ret = RET_ERR; continue}
                const dot     = this.world.getOrgIdx(offset);
                if (dot > -1) {org.ret = RET_ERR; continue} // organism on the way
                const code = org.code;
                if (ax < 0 || ax > code.length || bx <= ax) {org.ret = RET_ERR; continue}
                const newCode = code.subarray(ax, bx);
                org.code = code.splice(ax, bx - ax);
                if (newCode.length < 1 || org.cur() === IS_ORG_ID && this.orgs.full) {org.ret = RET_ERR; continue}
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
                if (org.code.length < 1) {this._removeOrg(org); break}
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
                org.energy -= Math.floor(org.code.length * Config.energyStepCoef);
                let offset = org.offset + DIR[abs(ax) % 8];
                if (offset < -1) {offset = LINE_OFFS + org.offset}
                else if (offset > MAX_OFFS) {offset = org.offset - LINE_OFFS}
                if (this.world.getOrgIdx(offset) > -1) {org.ret = RET_ERR; continue}
                this.world.moveOrg(org, offset);
                org.ret = RET_OK;
                continue;
            }

            case CODE_CMD_OFFS + 38:  // see
                ++line;
                const offset = org.offset + ax;
                if (offset < 0 || offset > MAX_OFFS) {ax = 0; continue}
                const dot = this.world.getOrgIdx(offset);
                ax = (dot < 0 ? 0 : this.orgsAndMolsRef[dot].color || Config.molColor);
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
                const dot    = this.world.getOrgIdx(offset);
                if (dot < 0) {org.ret = RET_ERR; continue}
                const nearOrg = this.orgsAndMolsRef[dot];
                ax = nearOrg.code[bx] || 0;
                org.ret = RET_OK;
                continue;
            }

            case CODE_CMD_OFFS + 42: {// nsplit
                ++line;
                if (org.ret !== 1) {org.ret = RET_ERR; continue}
                if (this.orgsAndMols.full) {org.ret = RET_ERR; continue}
                const offset  = org.offset + DIR[abs(ax) % 8];
                const dOffset = org.offset + DIR[abs(org.ret) % 8];
                if (offset === dOffset) {org.ret = RET_ERR; continue}
                const dot     = this.world.getOrgIdx(offset);
                if (dot < 0) {org.ret = RET_ERR; continue}
                const dDot    = this.world.getOrgIdx(dOffset);
                if (dDot > -1) {org.ret = RET_ERR; continue}
                const nearOrg = this.orgsAndMolsRef[dot];
                const newCode = nearOrg.code.subarray(0, bx);
                nearOrg.code  = nearOrg.code.splice(0, bx);
                if (newCode.length < 1) {org.ret = RET_ERR; continue}
                const cutOrg  = this._createOrg(dOffset, nearOrg, newCode);
                this._db && this._db.put(cutOrg, nearOrg);
                if (nearOrg.code.length < 1) {this._removeOrg(nearOrg)}
                const energy = newCode.length * Config.energyMultiplier;
                nearOrg.energy -= energy;
                cutOrg.energy   = energy;
                if (org.code.length < 1) {this._removeOrg(org); break}
                org.ret = RET_OK;
                continue;
            }

            case CODE_CMD_OFFS + 43: {// get
                ++line;
                if (org.ret !== 1 || org.packet) {org.ret = RET_ERR; continue}
                const dot = this.world.getOrgIdx(org.offset + DIR[abs(ax) % 8]);
                if (dot < 0) {org.ret = RET_ERR; continue}
                this._removeOrg(org.packet = this.orgsAndMolsRef[dot]);
                continue;
            }

            case CODE_CMD_OFFS + 44: {// put
                ++line;
                if (!org.packet) {org.ret = RET_ERR; continue}
                if (this.orgsAndMols.full) {org.ret = RET_ERR; continue}
                const offset = org.offset + DIR[abs(ax) % 8];
                const dot    = this.world.getOrgIdx(offset);
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

            case CODE_CMD_OFFS + 49:  // color
                line++;
                const newAx = abs(ax);
                org.color   = (newAx < ORG_MIN_COLOR ? ORG_MIN_COLOR : newAx) % 0xffffff;
                continue;
        }
    }
}

module.exports = BioVM;