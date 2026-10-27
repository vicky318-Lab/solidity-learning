import hre from "hardhat";
import { expect } from "chai";
import { DECIMALS, MINTING_AMOUNT } from "./constant";
import { MyToken, TinyBank } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TinyBank", () => {
    let signers: HardhatEthersSigner[];
    let managers: HardhatEthersSigner[];
    let myTokenC: MyToken;
    let tinyBankC: TinyBank;
    beforeEach(async () => {
        signers = await hre.ethers.getSigners();
        managers = [signers[1], signers[2], signers[3]];
         myTokenC = await hre.ethers.deployContract("MyToken", [
            "MyToken",
            "MT",
            DECIMALS,
            MINTING_AMOUNT,
        ]);
        tinyBankC = await hre.ethers.deployContract("TinyBank", [
            await myTokenC.getAddress(),
            managers.map((m) => m.address),
        ]);
        await myTokenC.setManager(tinyBankC.getAddress());
    });

    describe("Initialized state check", () => {
        it("should return totalStaked 0", async () => {
            expect(await tinyBankC.totalStaked()).equal(0)
        });
        it("should return staked 0 amount of signer0", async () => {
            const signer0 = signers[0];
            expect(await tinyBankC.staked(signer0.address)).equal(0);
        })
        });

        describe("Staking", async () => {
            it("should return staked amount", async () => {
              const signer0 = signers[0];
              const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
              await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
              await tinyBankC.stake(stakingAmount);
              expect(await tinyBankC.staked(signer0.address)).equal(stakingAmount);
              expect(await tinyBankC.totalStaked()).equal(stakingAmount);
              expect(await myTokenC.balanceOf(tinyBankC)).equal(
                await tinyBankC.totalStaked()
            ); 
            });

        });
            describe("withdraw", () => {
                it("should return 0 staked amount after withdrawing total token", async () => {
              const signer0 = signers[0];
              const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
              await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
              await tinyBankC.stake(stakingAmount);
              await tinyBankC.withdraw(stakingAmount);
              expect(await tinyBankC.staked(signer0.address)).equal(0);
            });     
          });

          describe("reward", () => {
            it("should reward 1MT every blocks", async () => {
                const signer0 = signers[0];
                const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
                await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
                await tinyBankC.stake(stakingAmount);

                const BLOCKS = 5n;
                const transferAmount = hre.ethers.parseUnits("1", DECIMALS);
                for (var i = 0; i < BLOCKS; i++) {
                await myTokenC.transfer(transferAmount, signer0.address);
            }

                await tinyBankC.withdraw(stakingAmount);
                expect(await myTokenC.balanceOf(signer0.address)).equal(
                hre.ethers.parseUnits((BLOCKS + MINTING_AMOUNT + 1n).toString())
            );
        });

        });
        
    describe("Multi Manager", () => {
        const newReward = hre.ethers.parseUnits("10", DECIMALS);

        it("should register 3 managers", async () => {
            for (let i = 0; i < managers.length; i++) {
                expect(await tinyBankC.managers(i)).equal(managers[i].address);
                expect(await tinyBankC.isManager(managers[i].address)).equal(true);
            }
        });

        it("should revert deployment with fewer than 3 managers", async () => {
            await expect(
                hre.ethers.deployContract("TinyBank", [
                    await myTokenC.getAddress(),
                    [signers[1].address, signers[2].address],
                ])
            ).to.be.revertedWith("At least 3 managers required");
        });

        it("should revert when non-manager confirms", async () => {
            const hacker = signers[4];
            await expect(tinyBankC.connect(hacker).confirm())
                .to.be.revertedWith("You are not a manager");
        });

        it("should revert when non-manager changes rewardPerBlock", async () => {
            const hacker = signers[4];
            await expect(tinyBankC.connect(hacker).setRewardPerBlock(newReward))
                .to.be.revertedWith("You are not a manager");
        });

        it("should revert when no manager has confirmed", async () => {
            await expect(tinyBankC.connect(managers[0]).setRewardPerBlock(newReward))
                .to.be.revertedWith("Not all confirmed yet");
        });

        it("should revert when only some managers have confirmed", async () => {
            await tinyBankC.connect(managers[0]).confirm();
            await tinyBankC.connect(managers[1]).confirm();
            await expect(tinyBankC.connect(managers[0]).setRewardPerBlock(newReward))
                .to.be.revertedWith("Not all confirmed yet");
        });

        it("should change rewardPerBlock after all managers confirm", async () => {
            for (const m of managers) {
                await tinyBankC.connect(m).confirm();
            }
            await tinyBankC.connect(managers[0]).setRewardPerBlock(newReward);
            expect(await tinyBankC.rewardPerBlock()).equal(newReward);
        });

        it("should require confirmations again after a change", async () => {
            for (const m of managers) {
                await tinyBankC.connect(m).confirm();
            }
            await tinyBankC.connect(managers[0]).setRewardPerBlock(newReward);
            await expect(tinyBankC.connect(managers[0]).setRewardPerBlock(newReward))
                .to.be.revertedWith("Not all confirmed yet");
        });
    });
});